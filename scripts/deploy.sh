#!/usr/bin/env bash

set -euo pipefail
"$(dirname "$0")/build_web.sh"
cd "$(dirname "$0")/../api"

if ! npx wrangler whoami >/dev/null 2>&1; then
	echo "Not Logged In. Run : npx wrangler login"
	npx wrangler login
fi

echo "Deploying Python Worker + Dashboard TO Cloudflare…"
npx wrangler deploy

if [[ "${1:-}" == "--fresh" ]]; then
	echo "Applying D1 Schema …"
	npx wrangler d1 execute markbase-db --remote --file=./schema.sql -y
fi

URL=$(npx wrangler deployments list 2>/dev/null | grep -o 'https://markbase-api[^ ]*workers.dev' | head -1 || true)
echo "Done - API :  https://markbase-api.spreadsheets600.workers.dev"
