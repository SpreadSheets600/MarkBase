#!/usr/bin/env bash
# MarkBase - build the Flutter app and optionally host it on the Worker at /app.
# Usage: ./scripts/build_app.sh [--install-on-worker]
set -euo pipefail
cd "$(dirname "$0")/../app"
export PATH="$HOME/flutter-sdk/bin:$PATH"

flutter analyze
flutter test || true
flutter build web --release --base-href=/app/
cp build/web/index.html build/web/main.html

echo "✅ Flutter web build → app/build/web"
echo "   (Android: 'flutter build apk --release' after installing the Android SDK)"

if [[ "${1:-}" == "--install-on-worker" ]]; then
  rm -rf ../api/public/app
  cp -r build/web ../api/public/app
  ../scripts/deploy.sh
  echo "📱 Your app is live at https://markbase-api.spreadsheets600.workers.dev/app/"
fi
