#!/usr/bin/env bash
# MarkBase - build the React dashboard (web/) into the Worker's asset dir (api/public).
set -euo pipefail
cd "$(dirname "$0")/../web"
[[ -d node_modules ]] || npm ci
rm -rf ../api/public/assets
npm run build
echo "✅ Dashboard built → api/public"
