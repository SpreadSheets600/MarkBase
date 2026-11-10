import hashlib
import re
import time
import uuid
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

import js
from pyodide.ffi import to_js

LIST_COLS = "id, title, url, folder_path, sort_index, date_added, updated_at, description, image, tags, deleted"
MAX_CONTENT = 60_000
MAX_CHANGES = 5000
HISTORY_DAYS = 60


def now_ms() -> int:
    return int(time.time() * 1000)


def key_of(folder: str, url: str) -> str:
    return hashlib.sha1(f"{folder}\n{url}".encode()).hexdigest()


def py(value):
    return value.to_py() if hasattr(value, "to_py") else value


def to_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def clip(value, n):
    return str(value or "")[:n]


async def rows(db, sql, *args):
    stmt = db.prepare(sql)
    if args:
        stmt = stmt.bind(*args)
    res = await stmt.all()
    return py(res.results) or []


async def run_batch(db, statements):
    for i in range(0, len(statements), 90):
        await db.batch(to_js(statements[i : i + 90]))


async def migrate_ids(db):
    flag = await rows(db, "SELECT value FROM meta WHERE key = 'ids_v2'")
    if flag:
        return
    legacy = await rows(
        db, "SELECT id, folder_path, url FROM bookmarks WHERE length(id) != 40"
    )
    stmts = []
    seen = set()
    for r in legacy:
        new_id = key_of(r["folder_path"] or "", r["url"] or "")
        if new_id in seen:
            stmts.append(db.prepare("DELETE FROM bookmarks WHERE id = ?").bind(r["id"]))
            continue
        seen.add(new_id)
        stmts.append(
            db.prepare(
                "DELETE FROM bookmarks WHERE id = ? AND EXISTS (SELECT 1 FROM bookmarks WHERE id = ?)"
            ).bind(r["id"], new_id)
        )
        stmts.append(
            db.prepare("UPDATE OR IGNORE bookmarks SET id = ? WHERE id = ?").bind(
                new_id, r["id"]
            )
        )
    stmts.append(
        db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('ids_v2', '1')")
    )
    await run_batch(db, stmts)


UPSERT = """
INSERT INTO bookmarks (id, parent_id, title, url, folder_path, sort_index, date_added, synced_at, updated_at, deleted)
VALUES (?, '', ?, ?, ?, ?, ?, ?, ?, 0)
ON CONFLICT(id) DO UPDATE SET
    title = excluded.title, sort_index = excluded.sort_index,
    synced_at = excluded.synced_at, updated_at = excluded.updated_at, deleted = 0
"""


async def changes(db, data):
    await migrate_ids(db)
    now = now_ms()
    cursor = to_int(data.get("cursor"))
    stmts = []
    for item in (data.get("upserts") or [])[:MAX_CHANGES]:
        url = clip(item.get("url"), 2048).strip()
        if not url:
            continue
        folder = clip(item.get("folder_path"), 512)
        stmts.append(
            db.prepare(UPSERT).bind(
                key_of(folder, url),
                clip(item.get("title"), 512),
                url,
                folder,
                to_int(item.get("sort_index")),
                to_int(item.get("date_added")),
                now,
                now,
            )
        )
    for item in (data.get("deletes") or [])[:MAX_CHANGES]:
        url = clip(item.get("url"), 2048).strip()
        if not url:
            continue
        stmts.append(
            db.prepare(
                "UPDATE bookmarks SET deleted = 1, updated_at = ? WHERE id = ? AND deleted = 0"
            ).bind(now, key_of(clip(item.get("folder_path"), 512), url))
        )
    await run_batch(db, stmts)

    where = "updated_at > ?" if cursor else "deleted = 0"
    args = (cursor,) if cursor else ()
    out = await rows(
        db,
        f"SELECT id, title, url, folder_path, sort_index, date_added, (deleted > 0) AS deleted, updated_at FROM bookmarks WHERE {where} AND deleted != 2 ORDER BY updated_at LIMIT {MAX_CHANGES}",
        *args,
    )
    return {"ok": True, "cursor": now, "changes": out}


async def list_bookmarks(db, trash=False):
    await migrate_ids(db)
    cond = "deleted = 1" if trash else "deleted = 0"
    return {
        "ok": True,
        "bookmarks": await rows(
            db,
            f"SELECT {LIST_COLS} FROM bookmarks WHERE {cond} ORDER BY folder_path, sort_index, title",
        ),
    }


async def add_bookmark(db, data):
    url = clip(data.get("url"), 2048).strip()
    if not re.match(r"^https?://", url):
        return {"error": "a valid http(s) url is required"}, 400
    folder = clip(data.get("folder_path"), 512) or "Bookmarks bar"
    now = now_ms()
    await (
        db.prepare(UPSERT)
        .bind(
            key_of(folder, url),
            clip(data.get("title"), 512) or url,
            url,
            folder,
            0,
            now,
            now,
            now,
        )
        .run()
    )
    return {"ok": True, "id": key_of(folder, url)}, 200


async def set_state(db, ids, deleted):
    now = now_ms()
    ids = [clip(i, 64) for i in (ids or [])][:500]
    await run_batch(
        db,
        [
            db.prepare(
                "UPDATE bookmarks SET deleted = ?, updated_at = ? WHERE id = ?"
            ).bind(deleted, now, i)
            for i in ids
        ],
    )
    return {"ok": True, "count": len(ids)}


async def move(db, ids, folder):
    folder = clip(folder, 512)
    now = now_ms()
    stmts = []
    for i in [clip(x, 64) for x in (ids or [])][:500]:
        got = await rows(
            db,
            "SELECT title, url, sort_index, date_added, content, description, image, tags, enriched_at FROM bookmarks WHERE id = ?",
            i,
        )
        if not got:
            continue
        b = got[0]
        new_id = key_of(folder, b["url"])
        if new_id == i:
            stmts.append(
                db.prepare(
                    "UPDATE bookmarks SET deleted = 0, updated_at = ? WHERE id = ? AND deleted = 1"
                ).bind(now, i)
            )
            continue
        stmts.append(
            db.prepare(
                "UPDATE bookmarks SET deleted = 3, updated_at = ? WHERE id = ?"
            ).bind(now, i)
        )
        stmts.append(
            db.prepare(
                "INSERT INTO bookmarks (id, parent_id, title, url, folder_path, sort_index, date_added, synced_at, updated_at, deleted, content, description, image, tags, enriched_at) "
                "VALUES (?, '', ?, ?, ?, 0, ?, ?, ?, 0, ?, ?, ?, ?, ?) "
                "ON CONFLICT(id) DO UPDATE SET deleted = 0, updated_at = excluded.updated_at"
            ).bind(
                new_id,
                b["title"],
                b["url"],
                folder,
                b["date_added"],
                now,
                now,
                b["content"],
                b["description"],
                b["image"],
                b["tags"],
                b["enriched_at"],
            )
        )
    await run_batch(db, stmts)
    return {"ok": True}


async def purge(db, ids):
    ids = [clip(i, 64) for i in (ids or [])][:500]
    await run_batch(
        db,
        [
            db.prepare(
                "UPDATE bookmarks SET deleted = 2, content = '', description = '', image = '', updated_at = ? WHERE id = ?"
            ).bind(now_ms(), i)
            for i in ids
        ],
    )
    return {"ok": True, "count": len(ids)}


async def list_notes(db):
    return {
        "ok": True,
        "notes": await rows(
            db,
            "SELECT id, title, body, folder_path, created_at, updated_at FROM notes WHERE deleted = 0 ORDER BY updated_at DESC",
        ),
    }


async def save_note(db, data):
    now = now_ms()
    note_id = clip(data.get("id"), 64) or uuid.uuid4().hex
    await (
        db.prepare(
            "INSERT INTO notes (id, title, body, folder_path, created_at, updated_at, deleted) VALUES (?, ?, ?, ?, ?, ?, 0) "
            "ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, folder_path = excluded.folder_path, updated_at = excluded.updated_at, deleted = 0"
        )
        .bind(
            note_id,
            clip(data.get("title"), 300),
            clip(data.get("body"), 200_000),
            clip(data.get("folder_path"), 512),
            now,
            now,
        )
        .run()
    )
    return {"ok": True, "id": note_id}


async def delete_note(db, note_id):
    await (
        db.prepare("UPDATE notes SET deleted = 1, updated_at = ? WHERE id = ?")
        .bind(now_ms(), clip(note_id, 64))
        .run()
    )
    return {"ok": True}


def snippet(text, q, width=140):
    text = re.sub(r"\s+", " ", text or "")
    i = text.lower().find(q.lower())
    if i < 0:
        return text[:width]
    start = max(0, i - 40)
    return ("…" if start else "") + text[start : start + width]


async def search(db, q):
    q = (q or "").strip()
    if len(q) < 2:
        return {"ok": True, "bookmarks": [], "notes": [], "pages": []}
    like = "%" + q.replace("%", "").replace("_", "") + "%"
    bms = await rows(
        db,
        f"SELECT {LIST_COLS}, content FROM bookmarks WHERE deleted = 0 AND (title LIKE ? OR url LIKE ? OR description LIKE ? OR content LIKE ? OR tags LIKE ?) LIMIT 60",
        like,
        like,
        like,
        like,
        like,
    )
    for b in bms:
        b["snippet"] = snippet(b.pop("content", ""), q)
    notes = await rows(
        db,
        "SELECT id, title, body, updated_at FROM notes WHERE deleted = 0 AND (title LIKE ? OR body LIKE ?) LIMIT 30",
        like,
        like,
    )
    for n in notes:
        n["snippet"] = snippet(n.pop("body", ""), q)
    pages = await rows(
        db,
        "SELECT url, title, description, image, content, visited_at FROM pages WHERE title LIKE ? OR content LIKE ? OR url LIKE ? ORDER BY visited_at DESC LIMIT 30",
        like,
        like,
        like,
    )
    for p in pages:
        p["snippet"] = snippet(p.pop("content", ""), q)
    return {"ok": True, "bookmarks": bms, "notes": notes, "pages": pages}


async def clip_page(db, data):
    url = clip(data.get("url"), 2048)
    if not re.match(r"^https?://", url):
        return {"error": "bad url"}, 400
    content = clip(data.get("content"), MAX_CONTENT)
    desc, image, title = (
        clip(data.get("description"), 600),
        clip(data.get("image"), 2048),
        clip(data.get("title"), 512),
    )
    now = now_ms()

    await (
        db.prepare(
            "UPDATE bookmarks SET content = ?, description = CASE WHEN ? != '' THEN ? ELSE description END, "
            "image = CASE WHEN ? != '' THEN ? ELSE image END, enriched_at = ? WHERE url = ? AND deleted = 0"
        )
        .bind(content, desc, desc, image, image, now, url)
        .run()
    )
    if data.get("history"):
        await (
            db.prepare(
                "INSERT INTO pages (url, title, description, image, content, dwell_sec, visited_at) VALUES (?, ?, ?, ?, ?, ?, ?) "
                "ON CONFLICT(url) DO UPDATE SET title = excluded.title, description = excluded.description, image = excluded.image, "
                "content = excluded.content, dwell_sec = pages.dwell_sec + excluded.dwell_sec, visited_at = excluded.visited_at"
            )
            .bind(url, title, desc, image, content, to_int(data.get("dwell_sec")), now)
            .run()
        )

        await (
            db.prepare("DELETE FROM pages WHERE visited_at < ?")
            .bind(now - HISTORY_DAYS * 86_400_000)
            .run()
        )
    return {"ok": True}, 200


async def clip_pages(db, data):
    pages = data.get("pages")
    if not isinstance(pages, list):
        return await clip_page(db, data)
    saved = 0
    for page in pages[:100]:
        payload, status = await clip_page(db, page)
        saved += 1 if status == 200 else 0
    return {"ok": True, "saved": saved}, 200


async def page_info(db, url):
    url = clip(url, 2048)
    bms = await rows(
        db,
        "SELECT id, title, folder_path, description, image, content, enriched_at FROM bookmarks WHERE url = ? AND deleted = 0",
        url,
    )
    pg = await rows(
        db,
        "SELECT title, description, image, content, dwell_sec, visited_at FROM pages WHERE url = ?",
        url,
    )
    pg = pg[0] if pg else None
    best = max(
        [b["content"] for b in bms] + ([pg["content"]] if pg else []) + [""], key=len
    )
    return {
        "ok": True,
        "bookmarked": bool(bms),
        "folders": [b["folder_path"] for b in bms],
        "history": (
            {"dwell_sec": pg["dwell_sec"], "visited_at": pg["visited_at"]}
            if pg
            else None
        ),
        "title": (pg or {}).get("title") or (bms[0]["title"] if bms else ""),
        "description": (pg or {}).get("description")
        or (bms[0]["description"] if bms else ""),
        "image": (pg or {}).get("image") or (bms[0]["image"] if bms else ""),
        "content": best,
        "words": len(best.split()) if best else 0,
        "retention_days": HISTORY_DAYS,
    }


async def forget_page(db, url):
    if not url or url == "all":
        await db.prepare("DELETE FROM pages").run()
    else:
        await db.prepare("DELETE FROM pages WHERE url = ?").bind(clip(url, 2048)).run()
    return {"ok": True}


async def list_pages(db):
    return {
        "ok": True,
        "pages": await rows(
            db,
            "SELECT url, title, description, image, dwell_sec, visited_at FROM pages ORDER BY visited_at DESC LIMIT 200",
        ),
    }


class _Page(HTMLParser):
    SKIP = {
        "script",
        "style",
        "noscript",
        "svg",
        "nav",
        "footer",
        "header",
        "aside",
        "form",
        "iframe",
    }

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta, self.title, self.text, self._skip, self._in_title = (
            {},
            "",
            [],
            0,
            False,
        )

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta":
            k = (a.get("property") or a.get("name") or "").lower()
            if k and a.get("content") and k not in self.meta:
                self.meta[k] = a["content"]
        elif tag == "title":
            self._in_title = True
        elif tag in self.SKIP:
            self._skip += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag in self.SKIP and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        elif not self._skip:
            s = data.strip()
            if len(s) > 2:
                self.text.append(s)


async def enrich_one(db, row):
    url = row["url"]
    image = desc = content = ""
    try:
        if urlparse(url).scheme in ("http", "https"):
            opts = to_js(
                {
                    "headers": {
                        "user-agent": "Mozilla/5.0 (compatible; MarkBaseBot/2.1)",
                        "accept": "text/html",
                    },
                    "redirect": "follow",
                    "signal": js.AbortSignal.timeout(6000),
                },
                dict_converter=js.Object.fromEntries,
            )
            resp = await js.fetch(url, opts)
            ctype = (resp.headers.get("content-type") or "").lower()
            if getattr(resp, "ok", False) and "html" in ctype:
                html = (await resp.text())[:400_000]
                p = _Page()
                p.feed(html)
                m = p.meta
                image = (
                    m.get("og:image")
                    or m.get("twitter:image")
                    or m.get("og:image:url")
                    or ""
                )
                if image:
                    image = urljoin(url, image)[:2048]
                desc = (
                    m.get("og:description")
                    or m.get("description")
                    or m.get("twitter:description")
                    or ""
                )[:600]
                content = " ".join(p.text)[:20_000]
    except Exception:
        pass
    await (
        db.prepare(
            "UPDATE bookmarks SET image = ?, description = ?, content = CASE WHEN content = '' THEN ? ELSE content END, enriched_at = ? WHERE id = ?"
        )
        .bind(image, desc, content, now_ms(), row["id"])
        .run()
    )


async def enrich(db, limit=8):
    import asyncio

    todo = await rows(
        db,
        f"SELECT id, url FROM bookmarks WHERE deleted = 0 AND enriched_at = 0 LIMIT {max(1, min(int(limit), 10))}",
    )
    await asyncio.gather(*[enrich_one(db, r) for r in todo])
    left = await rows(
        db, "SELECT COUNT(*) AS n FROM bookmarks WHERE deleted = 0 AND enriched_at = 0"
    )
    return {
        "ok": True,
        "done": len(todo),
        "remaining": int(left[0]["n"]) if left else 0,
    }
