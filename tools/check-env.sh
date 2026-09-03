#!/usr/bin/env bash
# CARSERVICE — Vérification environnement Mac + compatibilité stack
# Usage: ./tools/check-env.sh [--json]

set -euo pipefail

JSON_MODE=false
[[ "${1:-}" == "--json" ]] && JSON_MODE=true

# Charger nvm + Node du projet (évite `system` et pnpm Homebrew incompatible)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" && -f "$PROJECT_ROOT/.nvmrc" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh" --no-use
  pushd "$PROJECT_ROOT" >/dev/null
  nvm use "$(cat "$PROJECT_ROOT/.nvmrc")" >/dev/null 2>&1 || true
  popd >/dev/null
  if command -v node &>/dev/null; then
    NODE_BIN="$(dirname "$(command -v node)")"
    export PATH="$NODE_BIN:$PATH"
  fi
fi

# Versions requises / recommandées (alignées docs/tech-stack/versions.md)
REQ_NODE_MAJOR_MIN=20
REQ_NODE_MAJOR_MAX=24
REQ_PNPM_MIN="9.0.0"
REC_PNPM="9.15.0"
REQ_DOCKER="20.10.0"
REQ_GIT="2.30.0"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

issues=0
warnings=0
results=()

pass() { results+=("{\"status\":\"ok\",\"check\":\"$1\",\"detail\":\"$2\"}"); $JSON_MODE || echo -e "${GREEN}✓${NC} $1 — $2"; }
warn() { warnings=$((warnings+1)); results+=("{\"status\":\"warn\",\"check\":\"$1\",\"detail\":\"$2\"}"); $JSON_MODE || echo -e "${YELLOW}⚠${NC} $1 — $2"; }
fail() { issues=$((issues+1)); results+=("{\"status\":\"fail\",\"check\":\"$1\",\"detail\":\"$2\"}"); $JSON_MODE || echo -e "${RED}✗${NC} $1 — $2"; }

version_gte() {
  printf '%s\n%s' "$2" "$1" | sort -V -C 2>/dev/null
}

version_major() {
  echo "$1" | sed 's/^v//' | cut -d. -f1
}

if $JSON_MODE; then
  :
else
  echo "═══════════════════════════════════════════════════"
  echo "  CARSERVICE — Environnement & compatibilité Mac"
  echo "═══════════════════════════════════════════════════"
  echo ""
fi

# ── Système Mac ──
OS_NAME=$(sw_vers -productName 2>/dev/null || echo "unknown")
OS_VER=$(sw_vers -productVersion 2>/dev/null || echo "unknown")
ARCH=$(uname -m)

if [[ "$ARCH" == "arm64" ]]; then
  pass "Architecture" "Apple Silicon ($ARCH) — compatible Expo, Docker, Node"
elif [[ "$ARCH" == "x86_64" ]]; then
  pass "Architecture" "Intel ($ARCH) — compatible"
else
  warn "Architecture" "Architecture inconnue: $ARCH"
fi

pass "macOS" "$OS_NAME $OS_VER"

# Xcode Command Line Tools (requis iOS simulator / native modules)
if xcode-select -p &>/dev/null; then
  pass "Xcode CLI Tools" "$(xcode-select -p)"
else
  fail "Xcode CLI Tools" "Manquant — exécuter: xcode-select --install"
fi

# Watchman (recommandé React Native)
if command -v watchman &>/dev/null; then
  pass "Watchman" "$(watchman --version 2>/dev/null | head -1)"
else
  warn "Watchman" "Non installé — recommandé pour RN: brew install watchman"
fi

# CocoaPods (iOS builds)
if command -v pod &>/dev/null; then
  pass "CocoaPods" "$(pod --version)"
else
  warn "CocoaPods" "Non installé — requis builds iOS: brew install cocoapods"
fi

echo "" 2>/dev/null || true

# ── Node.js ──
if command -v node &>/dev/null; then
  NODE_V=$(node -v)
  NODE_MAJOR=$(version_major "$NODE_V")
  if [[ "$NODE_MAJOR" -ge "$REQ_NODE_MAJOR_MIN" && "$NODE_MAJOR" -le "$REQ_NODE_MAJOR_MAX" ]]; then
    pass "Node.js" "$NODE_V (cible: ${REQ_NODE_MAJOR_MIN}.x–${REQ_NODE_MAJOR_MAX}.x)"
  elif [[ "$NODE_MAJOR" -gt "$REQ_NODE_MAJOR_MAX" ]]; then
    warn "Node.js" "$NODE_V — plus récent que testé; utiliser .nvmrc (20 LTS) si problèmes"
  else
    fail "Node.js" "$NODE_V — minimum v${REQ_NODE_MAJOR_MIN} requis"
  fi
else
  fail "Node.js" "Non installé — nvm install 20 && nvm use"
fi

# nvm / .nvmrc
if [[ -f ".nvmrc" ]]; then
  NVMRC=$(cat .nvmrc | tr -d '[:space:]')
  if command -v node &>/dev/null; then
    CURRENT=$(node -v | sed 's/^v//')
    if [[ "$CURRENT" == "$NVMRC"* ]] || [[ "v$CURRENT" == "v$NVMRC"* ]]; then
      pass ".nvmrc" "Actif: v$CURRENT (cible $NVMRC)"
    else
      warn ".nvmrc" "Projet cible $NVMRC, actif v$CURRENT — exécuter: nvm use"
    fi
  fi
else
  warn ".nvmrc" "Fichier absent à la racine du monorepo"
fi

# ── pnpm ──
check_pnpm() {
  if command -v pnpm &>/dev/null; then
    PNPM_V=$(pnpm -v 2>/dev/null) || true
    if [[ -z "$PNPM_V" ]]; then
      fail "pnpm" "Installé mais crash — probablement pnpm 11 + Node 20. Fix: corepack prepare pnpm@9.15.4 --activate"
      return
    fi
    PNPM_MAJOR=$(echo "$PNPM_V" | cut -d. -f1)
    NODE_MAJOR=$(version_major "$(node -v 2>/dev/null || echo v0)")
    if [[ "$PNPM_MAJOR" -ge 10 && "$NODE_MAJOR" -lt 22 ]]; then
      fail "pnpm" "v$PNPM_V requiert Node ≥ 22. Avec Node $NODE_MAJOR: corepack enable && corepack prepare pnpm@9.15.4 --activate"
      return
    fi
    if version_gte "$PNPM_V" "$REQ_PNPM_MIN"; then
      pass "pnpm" "v$PNPM_V"
    else
      fail "pnpm" "v$PNPM_V — minimum $REQ_PNPM_MIN"
    fi
  else
    fail "pnpm" "Non installé — corepack enable && corepack prepare pnpm@9.15.4 --activate"
  fi
}
check_pnpm

# ── Git ──
if command -v git &>/dev/null; then
  GIT_V=$(git --version | awk '{print $3}')
  pass "Git" "v$GIT_V"
else
  fail "Git" "Non installé"
fi

# ── Docker ──
if command -v docker &>/dev/null; then
  DOCKER_V=$(docker -v | awk '{print $3}' | tr -d ',')
  if docker info &>/dev/null; then
    pass "Docker" "v$DOCKER_V — daemon actif"
  else
    warn "Docker" "v$DOCKER_V installé mais daemon arrêté — lancer Docker Desktop"
  fi
else
  fail "Docker" "Non installé — requis Postgres/Redis local (docker compose)"
fi

# ── Outils optionnels ──
if command -v eas &>/dev/null; then
  pass "EAS CLI" "$(eas --version 2>/dev/null | head -1)"
else
  warn "EAS CLI" "Non installé — npm i -g eas-cli (builds mobile)"
fi

if command -v psql &>/dev/null; then
  pass "psql client" "$(psql --version)"
else
  warn "psql" "Client PostgreSQL absent (optionnel si Docker uniquement)"
fi

# ── Espace disque ──
FREE_GB=$(df -g . 2>/dev/null | awk 'NR==2 {print $4}' || echo "?")
if [[ "$FREE_GB" != "?" && "$FREE_GB" -lt 10 ]]; then
  warn "Espace disque" "${FREE_GB} GB libres — recommander ≥ 20 GB pour monorepo + Docker"
else
  pass "Espace disque" "${FREE_GB} GB libres"
fi

# ── Réseau ports dev ──
check_port() {
  local port=$1 name=$2
  if lsof -i ":$port" -sTCP:LISTEN &>/dev/null; then
    warn "Port $port" "Occupé ($name) — peut entrer en conflit"
  fi
}
check_port 3000 "API"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"

echo "" 2>/dev/null || true

if $JSON_MODE; then
  printf '{"issues":%d,"warnings":%d,"checks":[%s]}\n' "$issues" "$warnings" "$(IFS=,; echo "${results[*]}")"
else
  echo "═══════════════════════════════════════════════════"
  echo -e "  Résultat: ${RED}$issues erreur(s)${NC}, ${YELLOW}$warnings avertissement(s)${NC}"
  if [[ $issues -eq 0 ]]; then
    echo -e "  ${GREEN}Environnement prêt pour le développement CARSERVICE${NC}"
  else
    echo -e "  ${RED}Corriger les erreurs avant de démarrer${NC}"
  fi
  echo "═══════════════════════════════════════════════════"
  echo ""
  echo "Docs: docs/tech-stack/README.md"
  echo "Skill IA: .cursor/skills/carservice-dev/SKILL.md"
  exit $issues
fi
