#!/usr/bin/env bash
# Smoke tests API CARSERVICE — health, catalogue, zones (+ admin optionnel)
# Usage:
#   ./tools/smoke-api.sh
#   API_URL=https://staging.example/api/v1 ./tools/smoke-api.sh
#   SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... ./tools/smoke-api.sh
set -euo pipefail

API="${API_URL:-http://localhost:3000/api/v1}"
PASS=0
FAIL=0

command -v jq >/dev/null || { echo "jq requis: brew install jq"; exit 1; }
command -v curl >/dev/null || { echo "curl requis"; exit 1; }

hr() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }

assert_http() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  # Accepte une liste "200|201"
  if [[ "$expected" == *'|'* ]]; then
    IFS='|' read -r -a codes <<< "$expected"
    for code in "${codes[@]}"; do
      if [[ "$actual" == "$code" ]]; then
        printf '  \033[0;32m✓\033[0m %s (HTTP %s)\n' "$name" "$actual"
        PASS=$((PASS + 1))
        return 0
      fi
    done
    printf '  \033[0;31m✗\033[0m %s — attendu HTTP %s, reçu %s\n' "$name" "$expected" "$actual"
    FAIL=$((FAIL + 1))
    return 0
  fi
  if [[ "$actual" == "$expected" ]]; then
    printf '  \033[0;32m✓\033[0m %s (HTTP %s)\n' "$name" "$actual"
    PASS=$((PASS + 1))
  else
    printf '  \033[0;31m✗\033[0m %s — attendu HTTP %s, reçu %s\n' "$name" "$expected" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

assert_jq() {
  local name="$1"
  local expr="$2"
  local body="$3"
  if echo "$body" | jq -e "$expr" >/dev/null 2>&1; then
    printf '  \033[0;32m✓\033[0m %s\n' "$name"
    PASS=$((PASS + 1))
  else
    printf '  \033[0;31m✗\033[0m %s — jq %s\n' "$name" "$expr"
    echo "$body" | jq . 2>/dev/null || echo "$body"
    FAIL=$((FAIL + 1))
  fi
}

hr "Smoke API — $API"

# --- Health ---
CODE=$(curl -sS -o /tmp/cs-smoke-health.json -w '%{http_code}' "$API/health" || echo 000)
assert_http "GET /health" "200" "$CODE"
BODY=$(cat /tmp/cs-smoke-health.json 2>/dev/null || echo '{}')
assert_jq "health.status=ok" '.data.status == "ok"' "$BODY"

CODE=$(curl -sS -o /tmp/cs-smoke-ready.json -w '%{http_code}' "$API/health/ready" || echo 000)
assert_http "GET /health/ready" "200" "$CODE"
BODY=$(cat /tmp/cs-smoke-ready.json 2>/dev/null || echo '{}')
assert_jq "ready.database=ok" '.data.checks.database == "ok"' "$BODY"

# --- Catalog ---
CODE=$(curl -sS -o /tmp/cs-smoke-cat.json -w '%{http_code}' "$API/catalog/categories" || echo 000)
assert_http "GET /catalog/categories" "200" "$CODE"
BODY=$(cat /tmp/cs-smoke-cat.json 2>/dev/null || echo '{}')
assert_jq "catégorie wash présente" '[.data[].slug] | index("wash") != null' "$BODY"

CODE=$(curl -sS -o /tmp/cs-smoke-offers.json -w '%{http_code}' "$API/catalog/offers?zone=lyon" || echo 000)
assert_http "GET /catalog/offers?zone=lyon" "200" "$CODE"
BODY=$(cat /tmp/cs-smoke-offers.json 2>/dev/null || echo '{}')
OFFER_ID=$(echo "$BODY" | jq -r '.data[0].id // empty')
if [[ -z "$OFFER_ID" ]]; then
  printf '  \033[0;31m✗\033[0m aucune offre — seed manquant ?\n'
  FAIL=$((FAIL + 1))
else
  printf '  \033[0;32m✓\033[0m offre seed id=%s\n' "$OFFER_ID"
  PASS=$((PASS + 1))

  CODE=$(curl -sS -o /tmp/cs-smoke-quote.json -w '%{http_code}' \
    -X POST "$API/catalog/quote" \
    -H 'Content-Type: application/json' \
    -d "{\"offerId\":\"$OFFER_ID\",\"vehicleType\":\"suv\",\"optionIds\":[],\"zoneSlug\":\"lyon\"}" || echo 000)
  assert_http "POST /catalog/quote" "200|201" "$CODE"
  BODY=$(cat /tmp/cs-smoke-quote.json 2>/dev/null || echo '{}')
  assert_jq "quote.totalCents > 0" '.data.breakdown.totalCents > 0' "$BODY"
fi

# --- Zones ---
CODE=$(curl -sS -o /tmp/cs-smoke-zone.json -w '%{http_code}' \
  -X POST "$API/zones/check" \
  -H 'Content-Type: application/json' \
  -d '{"lat":45.764,"lng":4.8357}' || echo 000)
assert_http "POST /zones/check (Lyon)" "200|201" "$CODE"
BODY=$(cat /tmp/cs-smoke-zone.json 2>/dev/null || echo '{}')
assert_jq "Lyon covered" '.data.covered == true' "$BODY"

# --- Admin optionnel ---
if [[ -n "${SMOKE_ADMIN_EMAIL:-}" && -n "${SMOKE_ADMIN_PASSWORD:-}" ]]; then
  hr "Admin login (optionnel)"
  CODE=$(curl -sS -o /tmp/cs-smoke-admin.json -w '%{http_code}' \
    -X POST "$API/auth/admin/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$SMOKE_ADMIN_EMAIL\",\"password\":\"$SMOKE_ADMIN_PASSWORD\"}" || echo 000)
  assert_http "POST /auth/admin/login" "201" "$CODE"
  BODY=$(cat /tmp/cs-smoke-admin.json 2>/dev/null || echo '{}')
  ACCESS=$(echo "$BODY" | jq -r '.data.accessToken // empty')
  if [[ -n "$ACCESS" ]]; then
    CODE=$(curl -sS -o /tmp/cs-smoke-dash.json -w '%{http_code}' \
      "$API/admin/dashboard" \
      -H "Authorization: Bearer $ACCESS" || echo 000)
    assert_http "GET /admin/dashboard" "200" "$CODE"
  else
    printf '  \033[0;31m✗\033[0m accessToken admin manquant\n'
    FAIL=$((FAIL + 1))
  fi
else
  printf '\n  (skip admin — définir SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD)\n'
fi

hr "Résultat smoke"
printf '  pass=%s fail=%s\n' "$PASS" "$FAIL"
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
echo "SMOKE OK"
