#!/bin/bash
# Builds the release .app bundle: dist/AI Teaching Recorder.app
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Building release binaries…"
# Build only the app product (the unit-test runner needs debug/testing mode).
swift build -c release --product AITeachingRecorder

BIN_DIR="$(swift build -c release --show-bin-path)"
APP="dist/AI Teaching Recorder.app"
echo "==> Assembling $APP"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN_DIR/AITeachingRecorder" "$APP/Contents/MacOS/AITeachingRecorder"
cp Resources/Info.plist "$APP/Contents/Info.plist"
cp Resources/AppIcon.icns "$APP/Contents/Resources/AppIcon.icns"

# Ad-hoc code signature so TCC (Screen Recording / Camera / Mic) can attribute permissions.
echo "==> Code signing (ad-hoc)…"
codesign --force --deep --sign - "$APP" >/dev/null 2>&1

echo "==> Done: $APP"
ls -la "$APP/Contents/MacOS"
