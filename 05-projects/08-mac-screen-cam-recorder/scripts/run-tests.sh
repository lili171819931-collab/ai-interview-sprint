#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "==> Unit tests…"
swift run AITRCoreUnitTests
echo "==> Done"
