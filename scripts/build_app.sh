#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname "$0")/../app"export PATH="$HOME/flutter-sdk/bin:$PATH"

flutter analyze
flutter test || true
flutter build web --release --base-href=/app/

cp build/web/index.html build/web/main.html

echo "Flutter Web Build : app/build/web"

if [[ "${1:-}" == "--install-on-worker" ]]; then
	rm -rf ../api/public/app
	cp -r build/web ../api/public/app
	../scripts/deploy.sh
	echo "📱 Your app is live at https://markbase-api.spreadsheets600.workers.dev/app/"
fi
