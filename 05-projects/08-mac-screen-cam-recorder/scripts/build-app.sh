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

# Sign with a persistent self-signed identity so TCC grants survive rebuilds; fall back to ad-hoc.
echo "==> Code signing…"
SIGN_IDENTITY="$(bash scripts/setup-signing.sh 2>/dev/null || echo "")"
KEYCHAIN="$HOME/Library/Keychains/aitr-signing.keychain-db"
if [ -n "$SIGN_IDENTITY" ] && security find-identity -p codesigning "$KEYCHAIN" 2>/dev/null | grep -q "$SIGN_IDENTITY"; then
  codesign --force --deep --sign "$SIGN_IDENTITY" --keychain "$KEYCHAIN" "$APP" >/dev/null 2>&1
else
  codesign --force --deep --sign - "$APP" >/dev/null 2>&1
fi

echo "==> Done: $APP"
ls -la "$APP/Contents/MacOS"
