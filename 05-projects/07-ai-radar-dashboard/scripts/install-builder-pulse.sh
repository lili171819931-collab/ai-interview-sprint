#!/usr/bin/env bash
# 安装 / 更新 BuilderPulse 本地副本（日报内容仓，非 npm 包）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR="$ROOT/vendor"
REPO="https://github.com/BuilderPulse/BuilderPulse.git"
TARGET="$VENDOR/BuilderPulse"

mkdir -p "$VENDOR"
if [[ -d "$TARGET/.git" ]]; then
  echo "↻ Updating BuilderPulse in vendor/BuilderPulse ..."
  git -C "$TARGET" pull --ff-only || git -C "$TARGET" fetch --depth 1 origin main && git -C "$TARGET" reset --hard origin/main
else
  echo "⬇ Cloning BuilderPulse into vendor/BuilderPulse ..."
  rm -rf "$TARGET"
  git clone --depth 1 "$REPO" "$TARGET"
fi

echo "✅ BuilderPulse installed at: $TARGET"
echo "   Next: npm run pulse:sync"
