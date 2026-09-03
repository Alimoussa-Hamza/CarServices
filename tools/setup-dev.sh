#!/usr/bin/env bash
# Active Node 20 + pnpm 9 pour CARSERVICE (compatible monorepo)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm install 20 2>/dev/null || true
  nvm use
else
  echo "nvm non trouvé — installer: https://github.com/nvm-sh/nvm"
  exit 1
fi

echo "Node: $(node -v)"

corepack enable
corepack prepare pnpm@9.15.4 --activate

echo "pnpm: $(pnpm -v)"
echo ""
echo "OK — lancer: ./tools/check-env.sh"
