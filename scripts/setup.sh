#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname "$0")/../api"

if ! npx wrangler whoami >/dev/null 2>&1; then
	echo "Opening Cloudflare login…"
	npx wrangler login
fi
echo "Logged In : $(npx wrangler whoami 2>/dev/null | grep 'Account Name' | cut -d'│' -f2 | xargs)"

# Database + Schema
DB_ID=$(npx wrangler d1 list 2>/dev/null | grep markbase-db || true)
if [[ -z "$DB_ID" ]]; then
	echo "Creating D1 Database…"
	npx wrangler d1 create markbase-db
	echo "Paste the new database_id into api/wrangler.jsonc, then re-run."
	exit 1
fi
echo "Applying schema (remote; idempotent)…"
npx wrangler d1 execute markbase-db --remote --file=./schema.sql -y

# Token Secret
if ! npx wrangler secret list 2>/dev/null | grep -q SYNC_TOKEN; then
	if [[ -f .env ]]; then
		TOKEN=$(cat .env)
	else
		TOKEN="mb_sync_$(openssl rand -hex 24)"
		echo "$TOKEN" >.env && chmod 600 .env
		echo "New token generated → api/.env"
	fi
	echo "$TOKEN" | npx wrangler secret put SYNC_TOKEN
else
	echo "SYNC_TOKEN already set."
fi

# Deploy
"$0" >/dev/null 2>&1 || true
./deploy.sh

URL="https://markbase-api.spreadsheets600.workers.dev"
TOKEN=$(cat .env 2>/dev/null || echo "run: npx wrangler secret list")

echo
echo "============================================================"
echo "  MarkBase Is Live"
echo " "
echo "  Dashboard : $URL  (paste token in browser)"
echo "  Token     : $TOKEN   ← same into extension popup + app"
echo "  Extension : load  $PWD/../extension  unpacked in chrome://extensions"
echo "  App       : cd ../app && flutter run"
echo "============================================================"
