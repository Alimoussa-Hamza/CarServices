#!/usr/bin/env bash
# Teste le flow auth complet : OTP send → verify → me → refresh → logout
# Usage: ./tools/test-auth.sh [phone] [role]
set -euo pipefail

API="${API_URL:-http://localhost:3000/api/v1}"
PHONE="${1:-+33612345678}"
ROLE="${2:-client}"

command -v jq >/dev/null || { echo "jq requis: brew install jq"; exit 1; }

hr() { printf '\n\033[1m%s\033[0m\n' "$1"; }

hr "1. POST /auth/otp/send  ($PHONE / $ROLE)"
curl -sS -X POST "$API/auth/otp/send" \
  -H 'Content-Type: application/json' \
  -d "{\"phone\":\"$PHONE\",\"role\":\"$ROLE\"}" | jq .

echo ""
echo "Le code OTP est affiché dans les logs de l'API (ligne [DEV OTP])."
read -r -p "Code à 6 chiffres : " CODE

hr "2. POST /auth/otp/verify"
TOKENS=$(curl -sS -X POST "$API/auth/otp/verify" \
  -H 'Content-Type: application/json' \
  -d "{\"phone\":\"$PHONE\",\"code\":\"$CODE\",\"acceptTerms\":true}")
echo "$TOKENS" | jq .

ACCESS=$(echo "$TOKENS" | jq -r '.data.accessToken // empty')
REFRESH=$(echo "$TOKENS" | jq -r '.data.refreshToken // empty')
[[ -n "$ACCESS" ]] || { echo "Échec verify — code invalide ou expiré."; exit 1; }

hr "3. GET /auth/me"
curl -sS "$API/auth/me" -H "Authorization: Bearer $ACCESS" | jq .

hr "4. POST /auth/refresh (rotation du refresh token)"
ROTATED=$(curl -sS -X POST "$API/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}")
echo "$ROTATED" | jq .

ACCESS=$(echo "$ROTATED" | jq -r '.data.accessToken // empty')
REFRESH=$(echo "$ROTATED" | jq -r '.data.refreshToken // empty')

hr "5. POST /auth/logout"
curl -sS -X POST "$API/auth/logout" \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}" | jq .

hr "6. POST /auth/refresh après logout (doit échouer avec REFRESH_INVALID)"
curl -sS -X POST "$API/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}" | jq .

hr "Flow auth terminé."
