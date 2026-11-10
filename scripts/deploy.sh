#!/usr/bin/env bash
# MarkBase — one-shot deploy to Cloudflare.
# Usage:  ./scripts/deploy.sh          (deploy worker + dashboard)
#         ./scripts/deploy.sh --fresh  (also apply D1 schema after deploy)
set -euo pipefail
cd "$(dirname "$0")/../api"

if ! npx wrangler whoami >/dev/null 2>&1; then
  echo "✋ Not logged in. Run: npx wrangler login"
  npx wrangler login
fi

echo "⏳ Deploying Python Worker + dashboard to Cloudflare…"
npx wrangler deploy

if [[ "${1:-}" == "--fresh" ]]; then
  echo "🗄  Applying D1 schema (remote)…"
  npx wrangler d1 execute markbase-db --remote --file=./schema.sql -y
fi

URL=$(npx wrangler deployments list 2>/dev/null | grep -o 'https://markbase-api[^ ]*workers.dev' | head -1 || true)
echo "✅ Done — API:  https://markbase-api.spreadsheets600.workers.dev  (dashboard at /)"
