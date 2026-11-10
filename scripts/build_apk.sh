#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname "$0")/../app"

export JAVA_HOME="${JAVA_HOME:-$HOME/android-toolchain/jdk}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-toolchain/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$HOME/flutter-sdk/bin:$JAVA_HOME/bin:$PATH"

flutter build apk --release --target-platform android-arm64

mkdir -p ../dist

cp build/app/outputs/flutter-apk/app-release.apk ../dist/markbase-arm64.apk

echo "Mobile APK Built : dist/markbase-arm64.apk"
