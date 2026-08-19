#!/bin/bash
# Creates a persistent self-signed code-signing identity in a dedicated keychain.
# Stable signing keeps TCC grants (Screen Recording / Camera / Mic) valid across rebuilds.
set -euo pipefail

SIGN_DIR="$HOME/.codex/aitr-signing"
KEYCHAIN="$HOME/Library/Keychains/aitr-signing.keychain-db"
IDENTITY="AI Teaching Recorder Dev"
KC_PASS="aitrpass"
P12_PASS="aitr123"

mkdir -p "$SIGN_DIR"

if ! security find-identity -p codesigning "$KEYCHAIN" 2>/dev/null | grep -q "$IDENTITY"; then
  echo "==> Creating self-signed code-signing identity…" >&2
  cd "$SIGN_DIR"
  # Self-signed cert with the code-signing EKU
  openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 3650 -nodes \
    -subj "/CN=$IDENTITY/O=Lili/C=CN" \
    -addext "extendedKeyUsage=codeSigning" \
    -addext "keyUsage=digitalSignature" 2>/dev/null
  # PKCS12 must use legacy algorithms for macOS Keychain import
  openssl pkcs12 -export -out cert.p12 -inkey key.pem -in cert.pem -passout pass:$P12_PASS -legacy 2>/dev/null

  rm -f "$KEYCHAIN"
  security create-keychain -p "$KC_PASS" "$KEYCHAIN"
  security set-keychain-settings -lut 21600 "$KEYCHAIN"
  security unlock-keychain -p "$KC_PASS" "$KEYCHAIN"
  security import cert.p12 -k "$KEYCHAIN" -P "$P12_PASS" -T /usr/bin/codesign -T /usr/bin/security
  security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KC_PASS" "$KEYCHAIN" || true
  security add-trusted-cert -r trustRoot -k "$HOME/Library/Keychains/login.keychain-db" cert.pem
  echo "==> Signing identity created." >&2
else
  echo "==> Reusing existing signing identity." >&2
fi

security unlock-keychain -p "$KC_PASS" "$KEYCHAIN"
security list-keychains -d user -s "$KEYCHAIN" "$HOME/Library/Keychains/login.keychain-db"
echo "$IDENTITY"
