"""MarkBase API - a Cloudflare Python Worker backed by D1.

Routes (all under /v1, auth via `Authorization: Bearer <SYNC_TOKEN>`):
  POST /v1/sync         - bulk-upsert a full bookmark snapshot from the extension.
                          Any previously-synced bookmark missing from the snapshot
                          is soft-deleted. Fully idempotent.
  GET  /v1/bookmarks    - the full, live list (what the phone app pulls).
  DELETE /v1/bookmarks  - wipe everything.
  POST /v1/auth/google  - exchange a Google ID token for a MarkBase session.
                          Returns { token, user: { name, email, picture } }
  GET  /v1/auth/me      - return current session info (Bearer token).
  GET  /health          - unauthenticated health probe.

Everything that isn't /v1/* is served as a static asset (the PWA dashboard).
"""

import base64
import hmac
import json
import time
from urllib.parse import parse_qs, urlparse

import js
import sync
from pyodide.ffi import to_js
from workers import Response, WorkerEntrypoint


# ---------------------------------------------------------------- constants

MAX_BOOKMARKS = 20_000
UPSERT_SQL = """
INSERT INTO bookmarks
    (id, parent_id, title, url, folder_path, sort_index, date_added, synced_at, deleted)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
ON CONFLICT(id) DO UPDATE SET
    parent_id  = excluded.parent_id,
    title      = excluded.title,
    url        = excluded.url,
    folder_path= excluded.folder_path,
    sort_index = excluded.sort_index,
    date_added = excluded.date_added,
    synced_at  = excluded.synced_at,
    deleted    = 0
"""
WIPE_ACTIVE_SQL = "UPDATE bookmarks SET deleted = 1 WHERE deleted = 0"
SELECT_ALL_SQL = """
SELECT id, parent_id, title, url, folder_path, sort_index, date_added, synced_at
FROM bookmarks WHERE deleted = 0
ORDER BY folder_path, sort_index, id
"""
COUNT_SQL = "SELECT COUNT(*) AS n FROM bookmarks WHERE deleted = 0"


def chunks(seq: list, size: int):
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def to_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------- worker

class Default(WorkerEntrypoint):
    async def fetch(self, request):
        try:
            path = urlparse(request.url).path.rstrip("/") or "/"
            method = request.method

            # CORS preflight - allow the dashboard origin to call /v1/* from JS
            if method == "OPTIONS":
                return cors_preflight()

            if path in ("/health", "/v1/health") and method == "GET":
                return json_response({"ok": True, "service": "markbase", "time": now_iso()})

            # Public, token-free favicon proxy.
            if path == "/v1/favicon" and method in ("GET", "HEAD"):
                return await self.handle_favicon(request)

            # ── Google OAuth routes (public, no SYNC_TOKEN required) ──────
            if path == "/v1/auth/google" and method == "POST":
                return await self.handle_google_auth(request)

            if path == "/v1/auth/me" and method == "GET":
                return await self.handle_me(request)

            if not path.startswith("/v1"):
                # PWA dashboard / static assets.
                if path in ("/app", "/app/"):
                    return await self.env.ASSETS.fetch("/app/main")
                res = await self.env.ASSETS.fetch(request)
                if res.status == 404 and "." not in path:
                    return await self.env.ASSETS.fetch("/index.html")
                return res

            # -- auth for everything else under /v1 ------------------------
            token = self.env.SYNC_TOKEN
            if not token:
                return json_response({"error": "SYNC_TOKEN secret is not set on the worker"}, 500)
            if not authenticate(request, token):
                return json_response({"error": "unauthorized"}, 401)

            if path == "/v1/sync" and method == "POST":
                return await self.handle_sync(request)

            db = self.env.DB
            query = parse_qs(urlparse(request.url).query)

            async def body():
                try:
                    return json.loads(await request.text() or "{}")
                except json.JSONDecodeError:
                    return {}

            def reply(result):
                payload, status = result if isinstance(result, tuple) else (result, 200)
                return json_response(payload, status)

            # -- v2.1: two-way sync, notes, trash, search, capture ----------
            if path == "/v1/changes" and method == "POST":
                return reply(await sync.changes(db, await body()))
            if path == "/v1/bookmarks":
                if method == "GET":
                    return reply(await sync.list_bookmarks(db, trash=(query.get("trash") or ["0"])[0] == "1"))
                if method == "POST":
                    return reply(await sync.add_bookmark(db, await body()))
                if method == "DELETE":
                    return await self.handle_wipe()
                return json_response({"error": "method not allowed"}, 405)
            if path == "/v1/bookmarks/trash" and method == "POST":
                return reply(await sync.set_state(db, (await body()).get("ids"), 1))
            if path == "/v1/bookmarks/restore" and method == "POST":
                return reply(await sync.set_state(db, (await body()).get("ids"), 0))
            if path == "/v1/bookmarks/purge" and method == "POST":
                return reply(await sync.purge(db, (await body()).get("ids")))
            if path == "/v1/bookmarks/move" and method == "POST":
                data = await body()
                return reply(await sync.move(db, data.get("ids"), data.get("folder_path")))
            if path == "/v1/notes":
                if method == "GET":
                    return reply(await sync.list_notes(db))
                if method == "POST":
                    return reply(await sync.save_note(db, await body()))
                if method == "DELETE":
                    return reply(await sync.delete_note(db, (query.get("id") or [""])[0]))
            if path == "/v1/search" and method == "GET":
                return reply(await sync.search(db, (query.get("q") or [""])[0]))
            if path == "/v1/clip" and method == "POST":
                return reply(await sync.clip_pages(db, await body()))
            if path == "/v1/page" and method == "GET":
                return reply(await sync.page_info(db, (query.get("url") or [""])[0]))
            if path == "/v1/pages":
                if method == "GET":
                    return reply(await sync.list_pages(db))
                if method == "DELETE":
                    return reply(await sync.forget_page(db, (query.get("url") or [""])[0]))
            if path == "/v1/enrich" and method == "POST":
                return reply(await sync.enrich(db, to_int((await body()).get("limit"), 8)))

            return json_response({"error": "not found", "path": path}, 404)

        except Exception as exc:  # pragma: no cover
            return json_response({"error": "internal error", "detail": str(exc)}, 500)

    # ── Google OAuth handler ───────────────────────────────────────────────

    async def handle_google_auth(self, request):
        """Exchange a Google ID token for a MarkBase session.

        The client (web dashboard) sends:
            { "id_token": "<Google JWT>" }

        We verify it with Google's tokeninfo endpoint (simple, no key management)
        and return a session response so the client can store it in localStorage.
        The session token we return is the same SYNC_TOKEN - this means Google
        auth is an identity layer on top of the shared token system.  When you
        supply your own GOOGLE_CLIENT_ID secret on the worker, we validate the
        audience claim too.
        """
        try:
            body = json.loads(await request.text() or "{}")
        except json.JSONDecodeError:
            return json_response({"error": "invalid JSON"}, 400)

        id_token = (body.get("id_token") or "").strip()
        access_token = (body.get("access_token") or "").strip()
        if not id_token and not access_token:
            return json_response({"error": "id_token or access_token required"}, 400)

        # Verify with Google's tokeninfo endpoint (no library needed)
        try:
            if id_token:
                verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
            else:
                verify_url = f"https://oauth2.googleapis.com/tokeninfo?access_token={access_token}"
            resp = await js.fetch(verify_url)
            if not getattr(resp, "ok", False):
                return json_response({"error": "Google rejected the token"}, 401)
            info = json.loads(await resp.text())
        except Exception as exc:
            return json_response({"error": f"Google verification failed: {exc}"}, 502)

        # Validate audience if GOOGLE_CLIENT_ID is configured
        client_id = str(getattr(self.env, "GOOGLE_CLIENT_ID", "") or "").strip()
        if client_id:
            token_aud = str(info.get("aud") or info.get("issued_to") or info.get("audience") or "").strip()
            if token_aud and token_aud != client_id:
                return json_response({"error": f"Token audience mismatch: {token_aud} != {client_id}"}, 401)

        user = {
            "name":    body.get("name") or info.get("name", "") or (info.get("email", "").split("@")[0] if info.get("email") else "User"),
            "email":   info.get("email", "") or body.get("email", ""),
            "picture": body.get("picture") or info.get("picture", ""),
            "sub":     info.get("sub", "") or info.get("user_id", ""),
        }

        # Return the shared SYNC_TOKEN as the session token.
        sync_token = ""
        try:
            sync_token = str(self.env.SYNC_TOKEN or "").strip()
        except Exception:
            sync_token = str(getattr(self.env, "SYNC_TOKEN", "") or "").strip()

        return json_response({
            "ok":    True,
            "token": sync_token,
            "user":  user,
        })

    async def handle_me(self, request):
        """Return basic session info for a valid Bearer token."""
        token = getattr(self.env, "SYNC_TOKEN", "")
        if not token or not authenticate(request, token):
            return json_response({"error": "unauthorized"}, 401)
        return json_response({"ok": True, "authenticated": True})



    # -- handlers ----------------------------------------------------------

    async def handle_sync(self, request):
        raw = await request.text()
        try:
            data = json.loads(raw or "{}")
        except json.JSONDecodeError:
            return json_response({"error": "invalid JSON body"}, 400)

        items = data.get("bookmarks") or []
        if not isinstance(items, list) or len(items) > MAX_BOOKMARKS:
            return json_response({"error": f"body must contain 1..{MAX_BOOKMARKS} bookmarks"}, 400)

        # Legacy snapshot endpoint (extension < 2.1). It used to soft-delete anything
        # missing from the snapshot, which is unsafe with several browsers, so it is
        # now a pure merge: upserts only, never deletes. New clients use /v1/changes.
        db = self.env.DB
        result = await sync.changes(db, {"upserts": items})
        total = Counter()
        await total.set(db, COUNT_SQL)
        return json_response({
            "ok": True,
            "received": len(items),
            "total": total.n,
            "time": now_iso(),
        })

    async def handle_list(self):
        db = self.env.DB
        res = await db.prepare(SELECT_ALL_SQL).all()
        records = to_py(res.results)
        total = Counter()
        await total.set(db, COUNT_SQL)
        return json_response({
            "ok": True,
            "count": len(records),
            "total": total.n,
            "bookmarks": records,
        })

    async def handle_wipe(self):
        await self.env.DB.prepare("DELETE FROM bookmarks").run()
        return json_response({"ok": True, "wiped": True})

    async def handle_favicon(self, request):
        domain = (parse_qs(urlparse(request.url).query).get("domain") or [""])[0].strip().lower()
        if not domain or len(domain) > 253 or not all(c.isalnum() or c in ".-_" for c in domain):
            return Response("bad domain", status=400)
        try:
            upstream = await js.fetch(f"https://www.google.com/s2/favicons?sz=64&domain={domain}")
        except Exception:
            return Response("upstream unavailable", status=502)
        if not getattr(upstream, "ok", False):
            return Response("upstream error", status=502)
        body = await upstream.arrayBuffer()
        content_type = upstream.headers.get("content-type") or "image/png"
        return Response(
            body,
            status=200,
            headers={
                "content-type": content_type,
                "cache-control": "public, max-age=86400",
                "access-control-allow-origin": "*",
            },
        )


# ---------------------------------------------------------------- helpers

class Counter:
    """Tiny await-friendly holder for a scalar COUNT(*) query."""

    n: int = 0

    async def set(self, db, sql):  # noqa: ANN001
        res = await db.prepare(sql).first()
        row = to_py(res) if hasattr(res, "to_py") else res
        self.n = int(to_int(row.get("n", 0)) if isinstance(row, dict) else 0)


def normalize(item, synced_at: int):
    if not isinstance(item, dict):
        return None
    url = item.get("url")
    if not isinstance(url, str) or not url.strip():
        return None
    return (
        str(item.get("id") or "")[:128],
        str(item.get("parent_id") or "")[:128],
        (item.get("title") or "")[:512],
        url[:2048],
        (item.get("folder_path") or "")[:512],
        to_int(item.get("sort_index"), 0),
        to_int(item.get("date_added"), 0),
        synced_at,
    )


def authenticate(request, token: str) -> bool:
    header = request.headers.get("authorization") or ""
    if not header.startswith("Bearer "):
        return False
    supplied = header[len("Bearer "):].strip()
    return hmac.compare_digest(supplied, token)


def to_py(value):
    if hasattr(value, "to_py"):
        return value.to_py()
    return value


CORS_HEADERS = {
    "access-control-allow-origin":  "*",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age":       "86400",
}


def cors_preflight() -> Response:
    """Return a 204 for CORS preflight (OPTIONS) requests."""
    return Response("", status=204, headers=CORS_HEADERS)


def json_response(payload, status: int = 200) -> Response:
    headers = {"content-type": "application/json; charset=utf-8", **CORS_HEADERS}
    return Response(json.dumps(payload), status=status, headers=headers)


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

