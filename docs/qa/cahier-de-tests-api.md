# Cahier de tests API — CARSERVICE (exhaustif)

> **Version :** 2.0 · **Base :** `/api/v1` · **JWT access local/test :** **24 h** (`JWT_ACCESS_TTL_SECONDS=86400`)  
> **Références :** [api-contrat-v1.md](../api-contrat-v1.md) · [regles-de-gestion.md](../regles-de-gestion.md)  
> **Légende Auto :** `TU` · `E2E` (gate/platform/all-apis) · `SMK` · `MAN` · `N/A` (non implémenté)

**Prérequis exécution auto :** Postgres + Redis + migrate + seed · OTP e2e = `123456`

---

## A. Health

| ID | Méthode | Path | Scénario | Attendu | P | Auto |
|----|---------|------|----------|---------|---|------|
| TC-HLT-001 | GET | `/health` | Liveness | 200 · `status=ok` | P0 | E2E, SMK |
| TC-HLT-002 | GET | `/health/ready` | DB up | 200 · `checks.database=ok` | P0 | E2E, SMK |
| TC-HLT-003 | GET | `/health/ready` | Redis down | check redis ≠ ok / 503 | P1 | MAN |

---

## B. Auth

| ID | Méthode | Path | Scénario | Attendu | P | Auto |
|----|---------|------|----------|---------|---|------|
| TC-AUTH-001 | POST | `/auth/otp/send` | Client phone E.164 | 201 · expiresIn OTP | P0 | E2E |
| TC-AUTH-002 | POST | `/auth/otp/send` | Provider | 201 | P0 | E2E |
| TC-AUTH-003 | POST | `/auth/otp/send` | Phone invalide | 400 VALIDATION_ERROR | P1 | TU |
| TC-AUTH-004 | POST | `/auth/otp/send` | role=admin | 400 validation | P1 | TU |
| TC-AUTH-005 | POST | `/auth/otp/send` | Rate limit >5/10min | 429 OTP_RATE_LIMIT | P1 | TU |
| TC-AUTH-006 | POST | `/auth/otp/verify` | Code OK + CGU | 201 · access+refresh · **expiresIn=86400** (local) | P0 | E2E |
| TC-AUTH-007 | POST | `/auth/otp/verify` | Code faux | 401 OTP_INVALID | P0 | E2E, TU |
| TC-AUTH-008 | POST | `/auth/otp/verify` | Code expiré | 401 OTP_EXPIRED/INVALID | P1 | TU |
| TC-AUTH-009 | POST | `/auth/otp/verify` | acceptTerms false | 400 | P1 | TU |
| TC-AUTH-010 | POST | `/auth/otp/verify` | ROLE_MISMATCH | 4xx métier | P1 | TU |
| TC-AUTH-011 | GET | `/auth/me` | Bearer valide | 200 · role/phone | P0 | E2E |
| TC-AUTH-012 | GET | `/auth/me` | Sans token | 401 | P0 | E2E, TU |
| TC-AUTH-013 | GET | `/auth/me` | Token expiré/invalide | 401 | P0 | TU |
| TC-AUTH-014 | POST | `/auth/refresh` | Refresh OK → rotation | 201 · nouveaux tokens | P0 | E2E |
| TC-AUTH-015 | POST | `/auth/refresh` | Rejeu ancien refresh | 401 REFRESH_INVALID | P0 | E2E |
| TC-AUTH-016 | POST | `/auth/logout` | Invalide refresh | 201 puis refresh KO | P0 | E2E |
| TC-AUTH-017 | POST | `/auth/admin/login` | Credentials OK | 201 · role=admin · expiresIn 86400 | P0 | E2E |
| TC-AUTH-018 | POST | `/auth/admin/login` | Mauvais password | 401 AUTH_INVALID_CREDENTIALS | P0 | E2E |
| TC-AUTH-019 | POST | `/auth/admin/login` | Rate limit | 429 AUTH_RATE_LIMIT | P1 | TU |
| TC-AUTH-020 | POST | `/auth/admin/login` | Email invalide | 400 | P1 | TU |

---

## C. Catalogue public

| ID | Méthode | Path | Scénario | Attendu | P | Auto |
|----|---------|------|----------|---------|---|------|
| TC-CAT-001 | GET | `/catalog/categories` | Liste actives | 200 · wash | P0 | E2E, SMK |
| TC-CAT-002 | GET | `/catalog/offers` | Sans filtre | 200 · offres actives | P0 | E2E |
| TC-CAT-003 | GET | `/catalog/offers` | `?zone=lyon` | 200 | P0 | E2E, SMK |
| TC-CAT-004 | GET | `/catalog/offers/:id` | ID seed | 200 · options | P0 | E2E |
| TC-CAT-005 | GET | `/catalog/offers/:id` | UUID inconnu | 404 | P1 | TU |
| TC-CAT-006 | POST | `/catalog/quote` | SUV + options Lyon | 200 · totalCents · duration | P0 | E2E, SMK, TU |
| TC-CAT-007 | POST | `/catalog/quote` | Body invalide | 400 VALIDATION_ERROR | P1 | TU |
| TC-CAT-008 | POST | `/catalog/quote` | Offre inactive | 4xx | P1 | E2E |
| TC-CAT-009 | POST | `/catalog/quote` | Zone inconnue | 4xx | P1 | TU |

---

## D. Zones

| ID | Méthode | Path | Scénario | Attendu | P | Auto |
|----|---------|------|----------|---------|---|------|
| TC-ZONE-001 | POST | `/zones/check` | Point Lyon | covered=true · slug lyon | P0 | E2E, SMK |
| TC-ZONE-002 | POST | `/zones/check` | Paris hors polygone | covered=false | P0 | E2E |
| TC-ZONE-003 | POST | `/zones/check` | Lat invalide | 400 | P1 | TU |
| TC-ZONE-004 | POST | `/zones/leads` | Email+adresse | 201 · captured | P0 | E2E |
| TC-ZONE-005 | POST | `/zones/leads` | Sans contact | 400 CONTACT_REQUIRED | P1 | TU |
| TC-ZONE-006 | POST | `/zones/leads` | addressText trop court | 400 | P1 | TU |

---

## E. Addresses (contrat — non implémenté API)

| ID | Path | Statut | Note |
|----|------|--------|------|
| TC-ADDR-001…004 | `/addresses` CRUD | **N/A** | Adresses créées via Prisma helper e2e ; endpoint REST à livrer |

---

## F. Providers & KYC

| ID | Méthode | Path | Scénario | Attendu | P | Auto |
|----|---------|------|----------|---------|---|------|
| TC-PRO-001 | GET | `/providers/me` | Pro connecté | 200 · profil | P0 | E2E |
| TC-PRO-002 | GET | `/providers/me` | Client | 403 FORBIDDEN | P0 | E2E |
| TC-PRO-003 | PATCH | `/providers/me` | Bio / méthodes | 200 | P1 | E2E |
| TC-PRO-004 | POST | `/providers/kyc/submit` | Dossier conforme | 201 · submitted | P0 | E2E |
| TC-PRO-005 | POST | `/providers/kyc/submit` | Sans RC Pro | 400 | P1 | TU |
| TC-PRO-006 | POST | `/providers/kyc/submit` | SIRET invalide | 400 | P1 | TU |
| TC-PRO-007 | GET | `/providers/kyc/status` | Après submit | 200 | P0 | E2E |
| TC-PRO-008 | GET | `/providers/kyc/alerts` | RC Pro OK | alert null | P1 | E2E |
| TC-PRO-009 | GET | `/providers/missions/eligibility` | Draft | 403 KYC_NOT_APPROVED | P0 | E2E |
| TC-PRO-010 | GET | `/providers/missions/eligibility` | Approved+charges | 200 eligible | P0 | E2E |
| TC-PRO-011 | PUT | `/providers/capabilities` | offerIds | 200 | P0 | E2E |
| TC-PRO-012 | PUT | `/providers/capabilities` | Liste vide | 400 | P1 | TU |
| TC-PRO-013 | GET | `/providers/capabilities` | Lecture | 200 | P0 | E2E |
| TC-PRO-014 | PUT | `/providers/availability` | Semaine 08–20 | 200 | P0 | E2E |
| TC-PRO-015 | PUT | `/providers/availability` | Chevauchement | 400 | P1 | TU |
| TC-PRO-016 | GET | `/providers/availability` | Lecture | 200 | P0 | E2E |
| TC-PRO-017 | PUT | `/providers/zones` | zone Lyon + rayon | 200 | P0 | E2E |
| TC-PRO-018 | GET | `/providers/zones` | Lecture | 200 | P0 | E2E |
| TC-PRO-019 | POST | `/providers/stripe/onboard` | return/refresh URLs | 201 · acct_ | P0 | E2E |
| TC-PRO-020 | POST | `/providers/stripe/onboard` | URL manquante | 400 | P1 | TU |

---

## G. Bookings

| ID | Méthode | Path | Scénario | Attendu | P | Auto |
|----|---------|------|----------|---------|---|------|
| TC-BOOK-001 | POST | `/bookings/slots` | J→J+14 Lyon | 201/200 · slots | P0 | E2E |
| TC-BOOK-002 | POST | `/bookings` | Happy create | 201 · snapshot prix · pending/payment | P0 | E2E |
| TC-BOOK-003 | POST | `/bookings` | addressId inconnu | 4xx | P0 | E2E |
| TC-BOOK-004 | POST | `/bookings` | Slot trop tôt | 4xx | P0 | E2E |
| TC-BOOK-005 | POST | `/bookings` | Hors zone | 4xx ZONE | P0 | E2E/TU |
| TC-BOOK-006 | POST | `/bookings` | Sans auth | 401 | P0 | E2E |
| TC-BOOK-007 | GET | `/bookings/available` | Pros éligibles | liste contient booking | P0 | E2E |
| TC-BOOK-008 | GET | `/bookings/available` | Pro draft | 403 | P0 | E2E |
| TC-BOOK-009 | POST | `…/accept` | Premier pro | accepted | P0 | E2E |
| TC-BOOK-010 | POST | `…/accept` | 2ᵉ pro | 409 déjà pris | P0 | E2E |
| TC-BOOK-011 | POST | `…/decline` | Pro refuse | 201/200 | P0 | E2E |
| TC-BOOK-012 | PATCH | `…/status` | en_route | 200 | P0 | E2E |
| TC-BOOK-013 | PATCH | `…/status` | in_progress + GPS | 200 | P0 | E2E |
| TC-BOOK-014 | PATCH | `…/status` | in_progress hors géofence | 4xx | P1 | E2E |
| TC-BOOK-015 | PATCH | `…/status` | completed sans photos | 400 | P0 | E2E |
| TC-BOOK-016 | PATCH | `…/status` | completed 2+2 photos | completed | P0 | E2E |
| TC-BOOK-017 | PATCH | `…/status` | Saut de statut | 400 | P0 | E2E/TU |
| TC-BOOK-018 | PATCH | `…/cancel` | Client >24h | cancelled · free | P0 | E2E |
| TC-BOOK-019 | PATCH | `…/cancel` | Pro | cancelled_by_provider | P1 | E2E |
| TC-BOOK-020 | GET | `/bookings` | Liste client | 200 | P0 | E2E |
| TC-BOOK-021 | GET | `/bookings` | Filtre group C12 | 200 | P1 | E2E |
| TC-BOOK-022 | GET | `/bookings/:id` | Détail + timeline | 200 | P0 | E2E |
| TC-BOOK-023 | GET | `/bookings/:id` | IDOR autre user | 403/404 | P0 | E2E |
| TC-BOOK-024 | — | matching T1 | Expand rayon | job OK | P1 | E2E |
| TC-BOOK-025 | — | matching T2 | unassigned | status unassigned | P0 | E2E |

---

## H. Paiements / Webhooks

| ID | Méthode | Path | Scénario | Attendu | P | Auto |
|----|---------|------|----------|---------|---|------|
| TC-PAY-001 | — | create booking | Pre-auth mock | payment authorized | P0 | E2E |
| TC-PAY-002 | — | completed | Capture | captured | P0 | E2E |
| TC-PAY-003 | POST | `/webhooks/stripe` | payment_failed | booking unpaid/expired | P0 | E2E |
| TC-PAY-004 | POST | `/webhooks/stripe` | Signature invalide | 4xx | P0 | TU |
| TC-PAY-005 | POST | `/webhooks/stripe` | account.updated | charges_enabled sync | P1 | E2E |
| TC-PAY-006 | POST | `/admin/bookings/:id/refund` | Admin refund | cancelled_by_admin | P0 | E2E |
| TC-PAY-007 | POST | `/admin/bookings/:id/refund` | Double refund | 4xx | P1 | E2E |
| TC-PAY-008 | POST | `/admin/bookings/:id/refund` | Non-admin | 403 | P0 | E2E |

---

## I. Médias

| ID | Méthode | Path | Scénario | Attendu | P | Auto |
|----|---------|------|----------|---------|---|------|
| TC-MED-001 | POST | `/media/upload-url` | JPEG booking_photo | 200 · fileKey | P0 | E2E |
| TC-MED-002 | POST | `/media/confirm` | Confirm | photo attachée | P0 | E2E |
| TC-MED-003 | POST | `/media/upload-url` | MIME text/plain | 4xx | P0 | E2E |
| TC-MED-004 | POST | `/media/confirm` | fileKey invalide | 4xx | P0 | E2E |
| TC-MED-005 | POST | `/media/upload-url` | Quota dépassé | 4xx | P0 | E2E |
| TC-MED-006 | POST | `/media/upload-url` | Sans auth | 401 | P0 | E2E |

---

## J. Avis & litiges

| ID | Méthode | Path | Scénario | Attendu | P | Auto |
|----|---------|------|----------|---------|---|------|
| TC-REV-001 | POST | `/reviews` | Post-completed | 201 · rating_avg | P0 | E2E |
| TC-REV-002 | POST | `/reviews` | >72h | 4xx | P0 | E2E |
| TC-REV-003 | POST | `/reviews` | Note hors 1–5 | 400 | P1 | TU |
| TC-REV-004 | GET | `/reviews/provider/:id` | Public | 200 | P0 | E2E |
| TC-DSP-001 | POST | `/disputes` | ≤48h | disputed · payout gelé | P0 | E2E |
| TC-DSP-002 | POST | `/disputes` | >48h | 4xx | P0 | E2E |
| TC-DSP-003 | POST | `/disputes` | Desc trop courte | 400 | P1 | TU |
| TC-DSP-004 | GET | `/disputes/:id` | Détail | **N/A** si non exposé | — | — |

---

## K. Notifications

| ID | Méthode | Path | Scénario | Attendu | P | Auto |
|----|---------|------|----------|---------|---|------|
| TC-NOT-001 | POST | `/users/push-token` | Token Expo | 201 | P0 | E2E |
| TC-NOT-002 | POST | `/users/push-token` | Token mal formé | 400 | P1 | TU |
| TC-NOT-003 | — | Cycle mission | Jobs templates queue | push/sms/email mock | P0 | E2E |

---

## L. Admin

| ID | Méthode | Path | Scénario | Attendu | P | Auto |
|----|---------|------|----------|---------|---|------|
| TC-ADM-001 | GET | `/admin/dashboard` | KPIs | 200 | P0 | E2E |
| TC-ADM-002 | GET | `/admin/dashboard` | Client | 403 | P0 | E2E |
| TC-ADM-003 | GET | `/admin/providers/pending` | File KYC | 200 · items | P0 | E2E |
| TC-ADM-004 | POST | `/admin/providers/:id/approve` | Approve | 200 · approved | P0 | E2E |
| TC-ADM-005 | POST | `/admin/providers/:id/reject` | Motif ≥5 | 200 · rejected | P0 | E2E |
| TC-ADM-006 | POST | `/admin/providers/:id/reject` | Motif court | 400 | P1 | TU |
| TC-ADM-007 | GET | `/admin/catalog/categories` | Toutes | 200 | P0 | E2E |
| TC-ADM-008 | PATCH | `/admin/catalog/categories/:id` | Update name | 200 | P1 | E2E |
| TC-ADM-009 | GET | `/admin/catalog/offers` | Liste | 200 | P0 | E2E |
| TC-ADM-010 | GET | `/admin/catalog/offers/:id` | Détail | 200 | P0 | E2E |
| TC-ADM-011 | POST | `/admin/catalog/offers` | Créer | 201 | P0 | E2E |
| TC-ADM-012 | POST | `/admin/catalog/offers/:id/options` | Option | 201 | P0 | E2E |
| TC-ADM-013 | PATCH | `/admin/catalog/offers/:id` | Soft-disable | invisible public | P0 | E2E |
| TC-ADM-014 | PATCH | `/admin/catalog/options/:id` | Update option | 200 | P1 | E2E |
| TC-ADM-015 | GET | `/admin/zones` | Liste | 200 | P0 | E2E |
| TC-ADM-016 | POST | `/admin/zones` | Créer polygone | 201 | P0 | E2E |
| TC-ADM-017 | GET | `/admin/zones/:id` | Détail | 200 | P0 | E2E |
| TC-ADM-018 | PATCH | `/admin/zones/:id` | Update | 200 | P0 | E2E |
| TC-ADM-019 | GET | `/admin/zones/:id/pricing` | Pricing | 200 | P0 | E2E |
| TC-ADM-020 | PUT | `/admin/zones/:id/pricing/:offerId` | Upsert | 200 | P0 | E2E |
| TC-ADM-021 | GET | `/admin/bookings` | Liste | 200 | P0 | E2E |
| TC-ADM-022 | GET | `/admin/bookings/:id` | Détail | 200 | P0 | E2E |
| TC-ADM-023 | GET/PATCH | `/admin/disputes*` | Resolve | **N/A** / à renforcer | P1 | MAN |
| TC-ADM-024 | GET/PATCH | `/admin/config` | Config | **N/A** | P2 | — |

---

## M. Scénarios bout-en-bout (SC)

| ID | Enchaînement | Critère GO | Auto |
|----|--------------|------------|------|
| SC-01 | OTP client → quote → booking → pending_provider | booking créé | E2E + MAN staging |
| SC-02 | Pro accept → en_route → in_progress → photos → completed + capture | completed | E2E + MAN |
| SC-03 | Hors zone | covered=false · pas de booking | E2E + MAN |
| SC-04 | Cancel client >24h | auth released | E2E + MAN |
| SC-05 | Admin reject KYC | pro 403 missions | E2E + MAN |
| SC-06 | Litige post-completed | payout gelé | E2E + MAN |

---

## N. Config auth tests

| Variable | Valeur locale/test | Prod recommandée |
|----------|--------------------|------------------|
| `JWT_ACCESS_TTL_SECONDS` | **86400** (24 h) | 900 (15 min) |
| `JWT_REFRESH_TTL_SECONDS` | 604800 (7 j) | 604800 |
| OTP e2e | `123456` (E2eOtpService) | Twilio réel |

---

## O. Exécution

```bash
# Unitaires monorepo
pnpm test

# Toutes les gates + platform + all-apis
pnpm --filter @carservice/api test:e2e

# Smoke HTTP (API up)
./tools/smoke-api.sh
```

Feuille manuelle staging : date · env · exécuteur · GO/NOGO · IDs booking · bugs.

---

## Historique

| Date | Ver | Changements |
|------|-----|-------------|
| 2026-09-16 | 1.0 | Création initiale |
| 2026-09-16 | 2.0 | Exhaustif tous endpoints + JWT 24h tests + all-apis e2e |
