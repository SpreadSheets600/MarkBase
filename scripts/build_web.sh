#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")/../web"
[[ -d node_modules ]] || npm ci

rm -rf ../api/public/assets
npm run build

echo "Dashboard Built : api/public"
