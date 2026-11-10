"""MarkBase API — a Cloudflare Python Worker backed by D1.

Routes (all under /v1, auth via `Authorization: Bearer <SYNC_TOKEN>`):
  POST /v1/sync      — bulk-upsert a full bookmark snapshot from the extension.
                       Any previously-synced bookmark missing from the snapshot
                       is soft-deleted. Fully idempotent.
  GET  /v1/bookmarks — the full, live list (what the phone app pulls).
  DELETE /v1/bookmarks — wipe everything (used by the dashboard's reset button).
  GET  /health       — unauthenticated health probe.

Everything that isn't /v1/* is served as a static asset (the PWA dashboard).
"""

import hmac
import json
import time
from urllib.parse import urlparse

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

            if path in ("/health", "/v1/health") and method == "GET":
                return json_response({"ok": True, "service": "markbase", "time": now_iso()})

            if not path.startswith("/v1"):
                # PWA dashboard / static assets (with a small SPA-ish tweak for
                # the hosted Flutter web app that lives under /app).
                if path in ("/app", "/app/"):
                    return await self.env.ASSETS.fetch("/app/main")
                return await self.env.ASSETS.fetch(request)

            # -- auth for everything under /v1 -----------------------------
            token = self.env.SYNC_TOKEN
            if not token:
                return json_response({"error": "SYNC_TOKEN secret is not set on the worker"}, 500)
            if not authenticate(request, token):
                return json_response({"error": "unauthorized"}, 401)

            if path == "/v1/sync" and method == "POST":
                return await self.handle_sync(request)

            if path == "/v1/bookmarks":
                if method == "GET":
                    return await self.handle_list()
                if method == "DELETE":
                    return await self.handle_wipe()
                return json_response({"error": "method not allowed"}, 405)

            return json_response({"error": "not found", "path": path}, 404)

        except Exception as exc:  # pragma: no cover
            return json_response({"error": "internal error", "detail": str(exc)}, 500)

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

        db = self.env.DB
        synced_at = int(time.time() * 1000)
        rows = [normalize(item, synced_at) for item in items]
        rows = [r for r in rows if r is not None]

        # One transactional batch: deactivate everything, then the upserts
        # reactivate exactly the bookmarks still present in the browser.
        statements = [db.prepare(WIPE_ACTIVE_SQL)]
        for chunk in chunks(rows, 100):
            statements.extend(db.prepare(UPSERT_SQL).bind(*r) for r in chunk)
        results = await db.batch(to_js(statements))

        total = Counter()
        await total.set(db, COUNT_SQL)
        return json_response({
            "ok": True,
            "received": len(rows),
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


def json_response(payload, status: int = 200) -> Response:
    return Response(
        json.dumps(payload),
        status=status,
        headers={"content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*"},
    )


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
