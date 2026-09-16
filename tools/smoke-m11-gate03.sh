#!/usr/bin/env bash
# GATE-03 — smoke client API réelle (auth OTP → adresse → slots → booking → DB)
# Prérequis: API up sur :3000, Postgres 5434, Redis 6380, seed Lyon + pro éligible.
# Usage: ./tools/smoke-m11-gate03.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="${API_URL:-http://127.0.0.1:3000/api/v1}"
PHONE="${GATE03_PHONE:-+33699110022}"
DB_URL="${DATABASE_URL:-postgresql://carservice:carservice@127.0.0.1:5434/carservice}"
REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6380}"
OTP_CODE="${GATE03_OTP:-424242}"

command -v jq >/dev/null || { echo "jq requis"; exit 1; }
command -v redis-cli >/dev/null || { echo "redis-cli requis"; exit 1; }
command -v psql >/dev/null || { echo "psql requis"; exit 1; }

# Charge OTP_PEPPER depuis apps/api/.env si présent
if [[ -f "$ROOT/apps/api/.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^(OTP_PEPPER)=' "$ROOT/apps/api/.env" || true)
  set +a
fi
PEPPER="${OTP_PEPPER:-dev-otp-pepper-change-me}"

hr() { printf '\n\033[1m%s\033[0m\n' "$1"; }

hr "0. Health"
curl -sS "$API/health" | jq -e '.data.status == "ok"' >/dev/null

hr "1. OTP send + inject code connu ($OTP_CODE)"
curl -sS -X POST "$API/auth/otp/send" \
  -H 'Content-Type: application/json' \
  -d "{\"phone\":\"$PHONE\",\"role\":\"client\"}" | jq -e '.data.expiresIn' >/dev/null

HASH=$(node -e "const c=require('crypto');process.stdout.write(c.createHash('sha256').update('${OTP_CODE}:${PEPPER}').digest('hex'))")
redis-cli -u "$REDIS_URL" SET "otp:${PHONE}" "{\"hash\":\"${HASH}\",\"role\":\"client\"}" EX 300 >/dev/null

VERIFY=$(curl -sS -X POST "$API/auth/otp/verify" \
  -H 'Content-Type: application/json' \
  -d "{\"phone\":\"$PHONE\",\"role\":\"client\",\"code\":\"$OTP_CODE\",\"acceptTerms\":true}")
ACCESS=$(echo "$VERIFY" | jq -r '.data.accessToken // empty')
[[ -n "$ACCESS" ]] || { echo "$VERIFY" | jq .; exit 1; }
echo "auth OK"

hr "2. Offer wash-complete + adresse Lyon"
OFFER=$(curl -sS "$API/catalog/offers" | jq -r '.data[] | select(.slug=="wash-complete") | .id')
[[ -n "$OFFER" && "$OFFER" != null ]] || { echo "offer wash-complete manquante — seed"; exit 1; }

ADDR=$(curl -sS -X POST "$API/addresses" \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{"label":"GATE03","street":"Place Bellecour","city":"Lyon","postalCode":"69002","lat":45.7578,"lng":4.832}')
ADDRESS_ID=$(echo "$ADDR" | jq -r '.data.id // empty')
[[ -n "$ADDRESS_ID" ]] || { echo "$ADDR" | jq .; exit 1; }
echo "address=$ADDRESS_ID"

hr "3. Slots disponibles"
SLOTS=$(curl -sS -X POST "$API/bookings/slots" \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d "{\"offerId\":\"$OFFER\",\"vehicleType\":\"berline\",\"addressId\":\"$ADDRESS_ID\",\"optionIds\":[]}")
SLOT_START=$(echo "$SLOTS" | jq -r '[.data.days[].slots[] | select(.available==true)][0].start // empty')
[[ -n "$SLOT_START" ]] || {
  echo "Aucun créneau — seed demo provider (pnpm --filter @carservice/api prisma:seed)"
  echo "$SLOTS" | jq '{zone:.data.zone, days:(.data.days|length)}'
  exit 1
}
echo "slot=$SLOT_START"

hr "4. Create booking"
BOOK=$(curl -sS -X POST "$API/bookings" \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d "{\"offerId\":\"$OFFER\",\"vehicleType\":\"berline\",\"optionIds\":[],\"addressId\":\"$ADDRESS_ID\",\"slotStart\":\"$SLOT_START\"}")
BOOKING_ID=$(echo "$BOOK" | jq -r '.data.booking.id // empty')
STATUS=$(echo "$BOOK" | jq -r '.data.booking.status // empty')
REF=$(echo "$BOOK" | jq -r '.data.booking.reference // empty')
[[ -n "$BOOKING_ID" ]] || { echo "$BOOK" | jq .; exit 1; }
echo "booking=$BOOKING_ID status=$STATUS ref=$REF"

hr "5. GET detail + DB"
DETAIL=$(curl -sS "$API/bookings/$BOOKING_ID" -H "Authorization: Bearer $ACCESS")
echo "$DETAIL" | jq -e '.data.status == "pending_provider"' >/dev/null
DB_STATUS=$(psql "$DB_URL" -tAc "SELECT status FROM bookings WHERE id='$BOOKING_ID'")
[[ "$DB_STATUS" == "pending_provider" ]] || { echo "DB status=$DB_STATUS"; exit 1; }

hr "GATE-03 OK — booking $REF en Postgres ($BOOKING_ID)"
