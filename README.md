# 🔖 MarkBase

Your bookmarks, everywhere. A tiny, free, stateless sync stack:

| Piece | Tech | Where |
|---|---|---|
| **API** | Python Worker (Pyodide on the edge) + D1 SQLite | Cloudflare — `api/` |
| **Extension** | Chrome/Brave/Edge MV3 watcher, Pico.css popup | `extension/` |
| **Phone app** | Flutter · Material 3 · aurora glass theme | `app/` |
| **Dashboard** | PWA served by the same Worker (Bootstrap 5) | `api/public/` |

```
Browser bookmarks ──(auto, bearer token)──▶ Python Worker ──▶ D1
                                                ▲
                            Flutter app / PWA ──┘ (pull)
```

## Live setup (already done)

- Worker URL: `https://markbase-api.spreadsheets600.workers.dev`
- D1 database: `markbase-db`
- Sync token: `api/.env` (**never commit it** — same token goes in the extension + app)

## How sync works

- The extension watches *all* bookmark events (`created/changed/moved/removed`, imports too)
  and pushes a **full idempotent snapshot** after a 1.5s debounce; a safety-net alarm
  re-syncs every 30 min and failures retry with backoff (1/4/15 min).
- `POST /v1/sync` marks everything not in the snapshot as soft-deleted, then upserts —
  one atomic D1 batch. So deletions propagate too.
- The app/dashboard just pulls `GET /v1/bookmarks`.

## API

| Route | Auth | What |
|---|---|---|
| `POST /v1/sync` | bearer | Bulk upsert + diff-soft-delete (`{ "bookmarks": [...] }`) |
| `GET /v1/bookmarks` | bearer | Live list |
| `DELETE /v1/bookmarks` | bearer | Wipe all |
| `GET /health` | — | probe |

## Local development

```bash
cd api                && npm i
npx wrangler d1 execute markbase-db --local --file=./schema.sql
npx wrangler dev      # worker on :8787, DB local
```

Deploy new changes: `npx wrangler deploy`

## Load the extension locally

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select `markbase/extension/`
3. Open the popup → paste the Worker URL + sync token → Save
4. It syncs immediately; afterwards it's fully automatic.

## Build / run the phone app

```bash
cd app
flutter pub get
flutter run            # on a connected device/emulator
flutter build apk --release   # installable APK for your phone
```

Then in-app → Connect now → paste URL + token.

## PWA dashboard

Visit the Worker URL in any browser (phone included) → paste token once →
your list, searchable, grouped, with favicons. Installable ("Add to Home Screen").

## Rotate the token

```bash
openssl rand -hex 24 | (echo "mb_sync_$(cat)") > api/.env
cat api/.env | npx wrangler secret put SYNC_TOKEN
```
