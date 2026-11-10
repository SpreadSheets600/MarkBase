CREATE TABLE IF NOT EXISTS bookmarks (
    id         TEXT PRIMARY KEY,
    parent_id  TEXT,
    title      TEXT NOT NULL DEFAULT '',
    url        TEXT,
    folder_path TEXT NOT NULL DEFAULT '',
    sort_index INTEGER,
    date_added INTEGER,
    synced_at  INTEGER,
    deleted    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_active ON bookmarks (deleted);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON bookmarks (folder_path);

CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT
);

-- See migrations/002_two_way_sync.sql for columns/tables added in v2.1.
