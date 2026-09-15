# Matrice de couverture API — CARSERVICE

> Alignée sur le [cahier de tests](cahier-de-tests-api.md) et le [contrat API](../api-contrat-v1.md).  
> Légende : ✅ couvert · ◐ partiel · ❌ manquant · N/A non implémenté · — hors scope

**Dernière revue :** 2026-09-16

---

## Synthèse

| Couche | Statut | Commentaire |
|--------|--------|-------------|
| Unitaires métier P0 | ✅ | state machine, pricing, matching, auth, payments, guards |
| Gates E2E M02–M10 | ✅ | fichiers `m02`…`m10` + `platform-flow` |
| Postman | ✅ | `docs/postman/carservice.postman_collection.json` |
| Smoke HTTP | ✅ | `tools/smoke-api.sh` |
| SC manuels staging | ❌ | M14-S02 à exécuter |
| E2E dans CI | ◐ | unit CI OK · e2e job à activer (migrate+seed) |

---

## Endpoints

| Method | Path | P | TU | E2E | Postman | Smoke | Notes |
|--------|------|---|----|-----|---------|-------|-------|
| GET | `/health` | P0 | — | ✅ | ✅ | ✅ | |
| GET | `/health/ready` | P0 | — | ✅ | ✅ | ✅ | |
| POST | `/auth/otp/send` | P0 | ✅ | ✅ m02 | ✅ | — | OTP mock e2e |
| POST | `/auth/otp/verify` | P0 | ✅ | ✅ m02 | ✅ | — | |
| POST | `/auth/admin/login` | P0 | ✅ | ✅ m02/m10 | ✅ | ◐ | si `SMOKE_ADMIN_*` |
| POST | `/auth/refresh` | P0 | ✅ | ✅ m02 | ✅ | — | |
| POST | `/auth/logout` | P0 | ✅ | ✅ m02 | ✅ | — | |
| GET | `/auth/me` | P0 | ✅ | ✅ m02 | ✅ | — | |
| GET | `/catalog/categories` | P0 | ✅ | ✅ m03 | ✅ | ✅ | |
| GET | `/catalog/offers` | P0 | ✅ | ✅ m03 | ✅ | ✅ | |
| GET | `/catalog/offers/:id` | P0 | ✅ | ✅ m03 | ✅ | — | |
| POST | `/catalog/quote` | P0 | ✅ | ✅ m03 | ✅ | ✅ | |
| GET | `/addresses` | P1 | — | — | ◐ | — | **N/A API** — adresses via Prisma e2e helper |
| POST | `/addresses` | P1 | — | — | ◐ | — | N/A API (contrat anticipé) |
| PATCH | `/addresses/:id` | P2 | — | — | — | — | N/A |
| DELETE | `/addresses/:id` | P2 | — | — | — | — | N/A |
| POST | `/zones/check` | P0 | ✅ | ✅ m03 | ✅ | ✅ | |
| POST | `/zones/leads` | P2 | ◐ | ✅ m03 | ◐ | — | |
| GET | `/providers/me` | P0 | ✅ | ✅ m04 | ✅ | — | |
| PATCH | `/providers/me` | P1 | ✅ | ◐ | ✅ | — | |
| POST | `/providers/kyc/submit` | P0 | ✅ | ✅ m04 | ✅ | — | |
| GET | `/providers/kyc/status` | P0 | ✅ | ✅ m04 | ✅ | — | |
| GET | `/providers/kyc/alerts` | P1 | ✅ | ✅ m04 | ✅ | — | |
| GET | `/providers/missions/eligibility` | P0 | ✅ | ✅ m04 | ✅ | — | |
| POST | `/providers/stripe/onboard` | P1 | ✅ | ✅ m04 | ✅ | — | |
| GET/PUT | `/providers/availability` | P0 | ✅ | ✅ m04 | ✅ | — | |
| GET/PUT | `/providers/zones` | P0 | ✅ | ✅ m04 | ✅ | — | |
| GET/PUT | `/providers/capabilities` | P0 | ✅ | ✅ m04 | ✅ | — | |
| POST | `/bookings` | P0 | ✅ | ✅ m05 | ✅ | — | |
| POST | `/bookings/slots` | P0 | ✅ | ✅ m05 | ✅ | — | |
| GET | `/bookings` | P0 | ✅ | ✅ m05 | ✅ | — | |
| GET | `/bookings/:id` | P0 | ✅ | ✅ m05 | ✅ | — | |
| PATCH | `/bookings/:id/cancel` | P0 | ✅ | ✅ m05 | ✅ | — | |
| POST | `/bookings/:id/accept` | P0 | ✅ | ✅ m05 | ✅ | — | |
| POST | `/bookings/:id/decline` | P0 | ✅ | ✅ m05 | ✅ | — | |
| PATCH | `/bookings/:id/status` | P0 | ✅ | ✅ m05 | ✅ | — | |
| GET | `/bookings/available` | P0 | ✅ | ✅ m05 | ✅ | — | |
| POST | `/webhooks/stripe` | P0 | ✅ | ✅ m06 | ✅ | — | |
| POST | `/admin/bookings/:id/refund` | P0 | ✅ | ✅ m06 | ✅ | — | |
| POST | `/media/upload-url` | P0 | ✅ | ✅ m07 | ✅ | — | |
| POST | `/media/confirm` | P0 | ✅ | ✅ m07 | ✅ | — | |
| POST | `/reviews` | P0 | ✅ | ✅ m08 | ✅ | — | |
| GET | `/reviews/provider/:id` | P0 | ✅ | ✅ m08 | ✅ | — | |
| POST | `/disputes` | P0 | ✅ | ✅ m08 | ✅ | — | |
| GET | `/disputes/:id` | P1 | ✅ | ◐ | ◐ | — | |
| POST | `/users/push-token` | P0 | ✅ | ✅ m09 | ✅ | — | |
| GET | `/admin/dashboard` | P0 | ✅ | ✅ m10 | ✅ | — | |
| GET | `/admin/providers/pending` | P0 | ✅ | ✅ m10 | ✅ | — | |
| POST | `/admin/providers/:id/approve` | P0 | ✅ | ✅ m10 | ✅ | — | |
| POST | `/admin/providers/:id/reject` | P0 | ✅ | ✅ m10 | ✅ | — | |
| GET/PATCH | `/admin/catalog/*` | P0 | ✅ | ✅ m10 | ✅ | — | |
| GET/POST/PATCH/PUT | `/admin/zones*` | P0 | ✅ | ✅ m10 | ✅ | — | |
| GET | `/admin/bookings` | P1 | — | — | ◐ | — | N/A ou partiel |
| GET/PATCH | `/admin/disputes*` | P1 | ◐ | ◐ | ◐ | — | resolve admin à renforcer |
| GET/PATCH | `/admin/config` | P2 | — | — | — | — | N/A si non livré |

---

## Mapping RG → tests

| RG | Tests auto principaux |
|----|----------------------|
| RG-CAT-02/03/05/06 | catalog.service.spec · m03 · m10 soft-disable · m05 snapshot |
| RG-ZONE-01/03 | zones.service.spec · m03 |
| RG-MATCH-01/03/04/05 | matching specs · m05 |
| RG-BOOK-01/03/04 | booking-state.machine · m05 · m07 |
| RG-CANCEL | booking-cancel.spec · m05 |
| RG-PAY-01/02/05/06 | payments specs · m06 |
| RG-KYC-01 | kyc guard · m04 |
| RG-NOTIF | m09 |
| RG-SEC-02 | m05 IDOR · guards |

---

## Gaps prioritaires (dette QA)

| Gap | Priorité | Action |
|-----|----------|--------|
| CRUD `/addresses` API | P1 | Implémenter + TC + Postman (contrat déjà écrit) |
| Admin resolve disputes E2E | P1 | Étendre m08/m10 |
| SC-01…06 staging sign-off | P0 | CS-M14-S02 |
| CI `test:e2e` | P1 | Job GitHub Actions migrate+seed |
| Perf p95 (guide-qa §6) | P2 | k6 phase 2 |

---

## Comment mettre à jour

1. Tout nouvel endpoint → ligne dans cette matrice + cas dans le cahier + Postman.  
2. Gate module → cocher E2E dans la ligne + fichier `mxx-*.e2e-spec.ts`.  
3. Revue matrice à chaque fin de sprint / gate Mxx.
