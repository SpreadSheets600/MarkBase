-- Two-way sync, content capture, notes, smart history.
ALTER TABLE bookmarks ADD COLUMN updated_at  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookmarks ADD COLUMN description TEXT    NOT NULL DEFAULT '';
ALTER TABLE bookmarks ADD COLUMN image       TEXT    NOT NULL DEFAULT '';
ALTER TABLE bookmarks ADD COLUMN content     TEXT    NOT NULL DEFAULT '';
ALTER TABLE bookmarks ADD COLUMN tags        TEXT    NOT NULL DEFAULT '';
ALTER TABLE bookmarks ADD COLUMN enriched_at INTEGER NOT NULL DEFAULT 0;
UPDATE bookmarks SET updated_at = COALESCE(synced_at, 0) WHERE updated_at = 0;
CREATE INDEX IF NOT EXISTS idx_bookmarks_updated ON bookmarks (updated_at);

CREATE TABLE IF NOT EXISTS notes (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT '',
    body        TEXT NOT NULL DEFAULT '',
    folder_path TEXT NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL DEFAULT 0,
    updated_at  INTEGER NOT NULL DEFAULT 0,
    deleted     INTEGER NOT NULL DEFAULT 0
);

-- "Smart history": pages worth remembering (dwell time, not every click).
CREATE TABLE IF NOT EXISTS pages (
    url         TEXT PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    image       TEXT NOT NULL DEFAULT '',
    content     TEXT NOT NULL DEFAULT '',
    dwell_sec   INTEGER NOT NULL DEFAULT 0,
    visited_at  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_pages_visited ON pages (visited_at);
