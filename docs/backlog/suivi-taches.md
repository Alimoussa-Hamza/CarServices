# Suivi des tâches — CARSERVICE

> Tracker vivant du développement. Une seule tâche **en cours** par piste ; les pistes avancent en parallèle.
> Détail des stories : [backlog-jira.md](../backlog-jira.md) · Board sprints : [sprint-board.md](sprint-board.md)

**Légende :** `[x]` fait · `[~]` en cours · `[ ]` à faire · `[!]` bloqué

---

## Vue d'ensemble

| Piste | Avancement | Tâche en cours |
|-------|-----------|----------------|
| A — Fondations & infra | 6/7 | Sentry (CS-M00-S05) |
| B — Packages partagés | 3/3 | — terminé |
| C — Auth & Users (M02) | 6/6 | — terminé |
| D — Tests & qualité | 9/9 | — terminé |
| E — Catalogue & zones (M03) | 7/7 | — terminé |
| F — Apps clientes | 3/6 | — en attente maquettes |
| G — Backend Pros & KYC (M04) | 8/8 | — terminé |
| H — Bookings (M05) | 10/10 | — terminé |
| I — Paiements Stripe (M06) | 6/6 | — terminé |
| J — Médias & preuves (M07) | 4/4 | — terminé |
| K — Avis & litiges (M08) | 4/4 | — terminé |
| L — Notifications (M09) | 4/4 | — terminé |
| M — Admin API (M10) | 3/8 | CS-M10-S04 CRUD catalog |
| N — Mobile client (M11) | 0/12 | — en attente maquettes |
| O — Mobile pro (M12) | 0/11 | — en attente maquettes |
| P — Admin web (M13) | 0/8 | — après M10 |
| Q — QA & launch (M14) | 0/6 | — fin de parcours |

---

## Piste A — Fondations & infra (S0)

- [x] **CS-M00-S01** Monorepo pnpm + Turborepo (7 workspaces, build vert)
- [x] **CS-M00-S02** Docker Compose — Postgres PostGIS `5434`, Redis `6380`
- [x] **CS-M00-S03** CI GitHub Actions (install, prisma generate, typecheck, build)
- [x] **CS-M00-S06** `.env.example` racine + par app
- [x] Scripts environnement — `tools/check-env.sh`, `tools/setup-dev.sh`
- [x] Script test auth — `tools/test-auth.sh`
- [ ] **CS-M00-S05** Sentry API + mobile
- [ ] **CS-M00-S04** Environnement staging (API déployée)

---

## Piste B — Packages partagés (S1)

- [x] **CS-M01-S01** `@carservice/shared-types` — enums + schémas Zod (auth, booking, vehicle)
- [x] **CS-M01-S02** `@carservice/api-client` — fetch typé, `ApiError`, envelope `data`/`error`
- [x] **CS-M01-S03** `@carservice/ui-tokens` — couleurs, spacing, radius, typographie

---

## Piste C — Auth & Users · Module M02 (S1–S2)

- [x] **CS-M02-S01** Schéma Prisma `users` / `client_profiles` / `provider_profiles` / `refresh_tokens`
  - [x] T01 Models Prisma
  - [x] T02 Migration `init_users_auth` + seed admin `+33600000000`
  - [x] T03 `PrismaService` + module global
- [x] **CS-M02-S02** Envoi OTP SMS
  - [x] T01 Service SMS Twilio (fallback log console en dev)
  - [x] T02 Cache OTP hashé SHA-256 + peppé, TTL 5 min (Redis)
  - [x] T03 Rate limit Redis 5 / 10 min → `429 OTP_RATE_LIMIT`
- [x] **CS-M02-S03** Vérification OTP + JWT
  - [x] T01 `POST /auth/otp/verify`
  - [x] T02 Access JWT 15 min + refresh 7 j (hashé en base)
  - [x] T03 Création auto du profil à la 1ʳᵉ connexion
- [x] **CS-M02-S04** `POST /auth/refresh` avec rotation + `POST /auth/logout`
- [x] **CS-M02-S05** `JwtAuthGuard` + `RolesGuard` + décorateurs `@Roles` / `@CurrentUser`
- [x] **CS-M02-S06** `GET /auth/me`

**Vérifié manuellement :** send → verify → me → refresh (rotation) → logout ; rejeu d'un refresh révoqué rejeté (`REFRESH_INVALID`).

---

## Piste D — Tests & qualité

- [x] Config Jest `apps/api` (ts-jest, coverage, Watchman désactivé)
- [x] Config Jest `packages/shared-types` (ts-jest, Watchman désactivé)
- [x] TU `OtpService` — génération 6 chiffres, hash stable, clés Redis, logs dev uniquement
- [x] TU `AuthService` — OTP invalide/expiré, rate limit, rotation refresh, `ROLE_MISMATCH`
- [x] TU `ZodValidationPipe` — payload valide / invalide → `VALIDATION_ERROR` + body Stripe Connect
- [x] TU `JwtAuthGuard` + `RolesGuard` — token absent/invalide, rôle refusé
- [x] TU `shared-types` — parse valide/invalide de chaque schéma
- [x] TU `api-client` — fetch wrapper, erreurs, auth endpoints, validation health
- [x] TU `ui-tokens` — couleurs, spacing, radius, typographie
- [x] `pnpm test` branché dans la CI
- [x] E2E API (`pnpm --filter @carservice/api test:e2e`) — Postgres réelle, OTP/SMS/Stripe mock, parcours M02→M05
- [x] Gate fin M05 — `test/e2e/m05-bookings.e2e-spec.ts` (parcours isolé + erreurs P0)
- [x] Gate fin M06 — `test/e2e/m06-payments.e2e-spec.ts` (pre-auth, capture, refund, webhook, charges_enabled)

**Vérifié automatiquement :**
- `@carservice/shared-types` : 109 tests passés
- `@carservice/api` : 111 tests passés
- `@carservice/api-client` : 35 tests passés
- `@carservice/ui-tokens` : 8 tests passés

---

## Piste E — Catalogue & zones · Module M03 (S2–S3)

- [x] **CS-M03-S01** Schéma Prisma catalogue (`service_categories`, `service_offers`, `offer_options`)
- [x] **CS-M03-S02** Schéma zones + polygone PostGIS (`service_zones`, `zone_pricing`)
- [x] **CS-M03-S03** `GET /catalog/offers` filtré par zone
- [x] **CS-M03-S04** `POST /catalog/quote` — pricing RG-CAT-02 (+ TU obligatoires)
- [x] **CS-M03-S05** `POST /zones/check` couverture PostGIS
- [x] **CS-M03-S06** `POST /zones/leads` hors zone
- [x] **CS-M03-S07** Seed catalogue + zone pilote Lyon

**Vérifié manuellement :** `GET /catalog/offers?zone=lyon` retourne 4 offres ; `POST /catalog/quote` SUV retourne `9700` cents ; `POST /zones/check` Lyon retourne `covered: true`.

---

## Piste F — Apps clientes (socle)

- [x] Socle `apps/admin` — Next.js 15, page statut API
- [x] Socle `apps/mobile-client` — Expo SDK 52, écran statut API
- [x] Socle `apps/mobile-provider` — Expo SDK 52, écran statut API
- [ ] Migration vers Expo Router (bloquée : conflit `@types/react` 18/19 dans le monorepo)

Détail écrans → pistes **N** (M11) et **O** (M12).

---

## Piste G — Backend Pros & KYC · Module M04

- [x] **CS-M04-S01** CRUD profil pro
  - [x] Schéma Prisma `provider_profiles` enrichi (bio, SIRET, KYC status, méthodes lavage, stats, adresse de base)
  - [x] `GET /providers/me` protégé `provider`
  - [x] `PATCH /providers/me` avec validation Zod
  - [x] Client API `api.providers.me/updateMe`
  - [x] TUs service providers + shared-types + api-client
- [x] **CS-M04-S02** Wizard KYC submit
  - [x] Modèle Prisma `provider_kyc_documents`
  - [x] Validation SIRET 14 chiffres
  - [x] RC Pro obligatoire et non expirée
  - [x] Au moins une méthode éco déclarée
  - [x] State machine `draft/rejected -> submitted`, blocage `submitted/approved`
  - [x] `POST /providers/kyc/submit` et `GET /providers/kyc/status`
  - [x] Tests shared-types + API + api-client
- [x] **CS-M04-S03** Capabilities (formules proposées)
  - [x] Modèle Prisma `provider_capabilities`
  - [x] `GET /providers/capabilities`
  - [x] `PUT /providers/capabilities`
  - [x] RG-KYC-05 : seules les offres actives `wash` sont conservées au MVP
  - [x] Tests shared-types + API + api-client
  - [x] Collection Postman créée/maintenue
- [x] **CS-M04-S04** Disponibilités hebdomadaires
  - [x] Modèles Prisma `provider_availability` et `provider_blocked_slots`
  - [x] `GET /providers/availability`
  - [x] `PUT /providers/availability`
  - [x] Validation : au moins une plage, horaires cohérents, pas de chevauchement par jour
  - [x] Créneaux bloqués ponctuels avec `endAt > startAt`
  - [x] Tests shared-types + API + api-client
  - [x] Collection Postman mise à jour
- [x] **CS-M04-S05** Zones intervention pro
  - [x] `GET /providers/zones`
  - [x] `PUT /providers/zones`
  - [x] Utilise `provider_zones` existant
  - [x] RG-ZONE-02 : seules les zones plateforme actives sont conservées
  - [x] Rayon optionnel par zone
  - [x] Tests shared-types + API + api-client
  - [x] Collection Postman mise à jour
- [x] **CS-M04-S06** Stripe Connect onboarding link
  - [x] Schémas Zod `CreateStripeOnboardingLink` / `StripeOnboardingLinkResponse`
  - [x] `POST /providers/stripe/onboard` protégé `provider`
  - [x] Création compte Connect Express FR + Account Link
  - [x] Réutilisation de `stripeAccountId` existant
  - [x] Fallback mock local sans clé Stripe réelle
  - [x] Client API `api.providers.createStripeOnboardingLink`
  - [x] Tests shared-types + API service/controller + api-client + Zod pipe
  - [x] Collection Postman + contrat API
- [x] **CS-M04-S07** Blocage missions si KYC non approved
  - [x] `KycApprovedGuard` réutilisable (exporté pour M05 bookings)
  - [x] `GET /providers/missions/eligibility`
  - [x] `KYC_NOT_APPROVED` si `draft` / `submitted` / `rejected`
  - [x] `RC_PRO_EXPIRED` si RC Pro manquante ou expirée (RG-KYC-02)
  - [x] Tests shared-types + service + guard + controller + api-client
  - [x] Collection Postman + contrat API
- [x] **CS-M04-S08** Alerte expiration RC Pro
  - [x] `GET /providers/kyc/alerts`
  - [x] `rcProAlert` sur `GET /providers/kyc/status` et submit
  - [x] J-30 `expiring_soon`, J-31 silencieux, après date `expired`
  - [x] Tests shared-types + API + api-client
  - [x] Collection Postman + contrat API

**Vérifié manuellement :** `GET /providers/kyc/alerts` provider draft sans RC Pro → `{ alert: null }` ; `GET /providers/kyc/status` inclut `rcProAlert: null`.

---

## Piste H — Bookings · Module M05

- [x] **CS-M05-S01** Schéma Prisma bookings + items + history
  - [x] Models `bookings`, `booking_items`, `booking_status_history`, `booking_photos`
  - [x] Enums alignés shared-types (13 statuts RG-BOOK + unassigned)
  - [x] Snapshots JSON `address_snapshot` / `pricing_snapshot` (RG-CAT-03)
  - [x] Index client/status, provider/status, slot/zone
  - [x] Migration `bookings_core`
  - [x] Tests enums Prisma ↔ Zod + schémas snapshot
- [x] **CS-M05-S02** BookingStateMachine (transitions RG-BOOK)
  - [x] Map `canTransition(from, to, actor)` + admin sur chaque arête
  - [x] Happy path + cancelled_* avant `in_progress` + expired / unassigned
  - [x] `completed` → `disputed` client ≤ 48 h
  - [x] `buildHistoryEntry` pour `booking_status_history` (persist S03)
  - [x] Tests matrice 13×13×4 + erreurs 409
- [x] **CS-M05-S03** POST /bookings création + snapshot
  - [x] JWT client · adresse owner · zone PostGIS (RG-ZONE-01)
  - [x] Quote API figée en `pricing_snapshot` (RG-CAT-03) + `address_snapshot`
  - [x] Référence `CS-YYYYMMDD-XXXX` + item + history draft→payment_authorized
  - [x] Pre-auth PaymentIntent capture manuelle (`pi_mock_*` sans clé Stripe)
  - [x] Postman **Create Booking** + `api.bookings.create`
- [x] **CS-M05-S04** MatchingService broadcast pros
  - [x] Filtre RG-MATCH-01 : KYC, RC Pro, capability, zone, rayon, dispo, conflits
  - [x] Score RG-MATCH-02 + top 8 persisté dans `booking_broadcasts`
  - [x] Transition `payment_authorized` → `pending_provider` + push Redis mock
  - [x] `GET /bookings/available` + `tryClaim` (verrou FOR UPDATE, HTTP accept = S05)
  - [x] Timeouts T1/T2 = S07 (BullMQ)
- [x] **CS-M05-S05** Accept / decline mission pro
  - [x] `POST /bookings/:id/accept` + verrou `tryClaim` (RG-MATCH-03)
  - [x] Adresse exacte renvoyée à l’accept (RG-SEC-02)
  - [x] `POST /bookings/:id/decline` retire le broadcast + pénalité taux
  - [x] Postman Accept/Decline + `api.bookings.accept/decline`
- [x] **CS-M05-S06** Transitions en_route, in_progress, completed
  - [x] `PATCH /bookings/:id/status` (pro assigné + KYC)
  - [x] Graphe `accepted` → `en_route` → `in_progress` → `completed` (RG-BOOK-01/02)
  - [x] Géofence optionnelle 200 m à `in_progress` (RG-BOOK-03)
  - [x] Photos min before/after du pro à `completed` (RG-BOOK-04)
  - [x] Postman Patch Status + `api.bookings.updateStatus`
- [x] **CS-M05-S07** Jobs BullMQ timeout T1/T2
  - [x] Queue `matching` : `expand-radius` (T1 30 min) + `timeout-unassigned` (T2 / H-2)
  - [x] T1 élargit le rayon ×2 et notifie plus de pros (RG-MATCH-04)
  - [x] T2 → `unassigned` si toujours en matching (RG-MATCH-05)
  - [x] Jobs idempotents, retry 3×, worker off en `NODE_ENV=test`
- [x] **CS-M05-S08** Annulation client/pro (RG-CANCEL)
  - [x] `PATCH /bookings/:id/cancel` client + pro
  - [x] Grille frais >24 h / 2–24 h / <2 h (0 / 20 / 50 %)
  - [x] Motif obligatoire pro (RG-CANCEL-01) ; client `in_progress` → litige (RG-CANCEL-02)
  - [x] Pénalité `acceptanceRate` pro + rematch urgent si < 2 h
  - [x] Postman Cancel + `api.bookings.cancel`
- [x] **CS-M05-S09** GET bookings list + detail + timeline
  - [x] `GET /bookings` client/pro, filtres `status` + `group` (C12)
  - [x] `GET /bookings/:id` + timeline `booking_status_history`
  - [x] RG-SEC-02 : adresse/tel masqués tant que le pro n’a pas accepté
  - [x] Postman List/Get + `api.bookings.list` / `get`
- [x] **CS-M05-S10** Créneaux disponibles (slot picker API)
  - [x] `POST /bookings/slots` — grille J→J+14, créneaux 1 h
  - [x] Capacité zone = au moins 1 pro RG-MATCH-01 (dispo, rayon, conflits)
  - [x] Délai min `minBookingLeadHours` (masque J+0 trop tôt)
  - [x] Postman List Booking Slots + `api.bookings.slots`

---

## Piste I — Paiements Stripe · Module M06

- [x] **CS-M06-S01** Schéma Prisma payments
  - [x] Enum `PaymentStatus` : authorized / captured / refunded / failed
  - [x] Table `payments` 1:1 booking, unique `stripe_payment_intent_id`
  - [x] Split `commission_cents` / `provider_net_cents` (RG-PAY-03)
  - [x] `computePaymentSplit` + alignement Prisma ↔ Zod
- [x] **CS-M06-S02** PaymentIntent manual capture à booking
  - [x] `POST /bookings` crée un PI `capture_method=manual` (mock `pi_mock_*` sans clé)
  - [x] Ligne `payments` persistée (`authorized` + split RG-PAY-03)
  - [x] Échec Stripe → pas de booking (RG-PAY-06)
- [x] **CS-M06-S03** Capture à completed + commission
  - [x] `PATCH /bookings/:id/status` `completed` capture le PI avant le statut
  - [x] Commission = `payments.commission_cents` (split RG-PAY-03, annotée `metadata[commission_cents]`)
  - [x] Échec capture → booking reste `in_progress` ; capture mock `pi_mock_*`
- [x] **CS-M06-S04** Webhook Stripe idempotent
  - [x] `POST /webhooks/stripe` — HMAC `Stripe-Signature` si `STRIPE_WEBHOOK_SECRET`
  - [x] Queue BullMQ `payments` / job `process-stripe-webhook`
  - [x] Table `stripe_events` (event id unique) + payment_failed → booking `expired`
- [x] **CS-M06-S05** Refund admin + annulation auth
  - [x] `POST /admin/bookings/:id/refund` — cancel PI si authorized, refund si captured
  - [x] Cancel client/pro libère l’auth (RG-PAY-05) / capture partielle des frais RG-CANCEL
- [x] **CS-M06-S06** Sync stripe_account charges_enabled
  - [x] Webhook `account.updated` → `provider_profiles.charges_enabled`
  - [x] Matching + missions bloqués si `charges_enabled=false` (`STRIPE_CHARGES_DISABLED`)
- [x] Gate fin M06 — `test/e2e/m06-payments.e2e-spec.ts`

---

## Piste J — Médias & preuves · Module M07

- [x] **CS-M07-S01** Config S3 Scaleway/R2
  - [x] `MediaModule` + `S3Service` (`@aws-sdk/client-s3`)
  - [x] Env `S3_ENDPOINT` / `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` — vide = mock local
- [x] **CS-M07-S02** POST `/media/upload-url` presigned
  - [x] PUT URL TTL 15 min (mock `cdn.carservice.test` sans clés)
  - [x] MIME whitelist + max 10 Mo photo / 5 Mo PDF
- [x] **CS-M07-S03** POST `/media/confirm` + link booking
  - [x] Parse `fileKey` (`bookings/{id}/{type}/{uuid}.ext` / `kyc/{userId}/{uuid}.ext`)
  - [x] HeadObject S3 (skip mock) + `booking_photos` idempotent sur `fileUrl`
  - [x] KYC confirm sans écriture `booking_photos`
- [x] **CS-M07-S04** Validation min photos clôture
  - [x] `BOOKING_MIN_BEFORE_PHOTOS` / `AFTER` = 2 (RG-BOOK-04)
  - [x] `BOOKING_PHOTOS_REQUIRED` si quota pro non atteint
- [x] Gate fin M07 — `test/e2e/m07-media.e2e-spec.ts`

---

## Piste K — Avis & litiges · Module M08

- [x] **CS-M08-S01** POST `/reviews` + calcul rating pro
  - [x] Table `reviews` (1 avis / booking) + `rating_avg` / `rating_count`
  - [x] RG-QUAL-02/04 — moyenne avis non masqués, booking `completed`
- [x] **CS-M08-S02** POST `/disputes` + freeze payout
  - [x] Table `disputes` + `payments.payout_frozen_at`
  - [x] Fenêtre 48 h + `completed` → `disputed` (RG-DISPUTE-01/03)
- [x] **CS-M08-S03** GET reviews public pro
  - [x] GET `/reviews/provider/:id` public, avis non masqués, pagination
- [x] **CS-M08-S04** Fenêtre 72h avis / 48h litige
  - [x] `REVIEW_WINDOW_EXPIRED` (72 h) + `BOOKING_DISPUTE_WINDOW_EXPIRED` (48 h)
- [x] Gate fin M08 — `test/e2e/m08-reviews-disputes.e2e-spec.ts`

---

## Piste L — Notifications · Module M09

- [x] **CS-M09-S01** Enregistrement expo push token
  - [x] Table `push_tokens` + POST `/users/push-token` (upsert)
- [x] **CS-M09-S02** Worker send-push (Expo API)
  - [x] Queue BullMQ `notifications` + job `send-push`
  - [x] Appel Expo Push API (mock local sans `EXPO_ACCESS_TOKEN`)
- [x] **CS-M09-S03** SMS + email templates booking
  - [x] Templates email (Brevo) + SMS booking
  - [x] Templates SMS
  - [x] Queue notifications multi-canal (`send-sms`, `send-email`)
- [x] **CS-M09-S04** Events : pro trouvé, en route, terminé, nouvelle mission
  - [x] Triggers sur changements de statut booking (`BookingNotificationEventsService`)
- [x] Gate fin M09 — `test/e2e/m09-notifications.e2e-spec.ts`

---

## Piste M — Admin API · Module M10

- [x] **CS-M10-S01** Auth admin (email + role)
  - [x] `POST /auth/admin/login` (email + password scrypt, role admin)
- [x] **CS-M10-S02** GET `/admin/dashboard` KPIs
  - [x] Agrégations GMV / bookings / acceptation / matching / litiges / KYC pending
- [x] **CS-M10-S03** Approve/reject KYC
  - [x] `GET /admin/providers/pending` + `POST .../approve` + `POST .../reject`
- [ ] **CS-M10-S04** CRUD catalog admin
- [ ] **CS-M10-S05** CRUD zones + pricing
- [ ] **CS-M10-S06** Admin bookings search + refund
- [ ] **CS-M10-S07** Resolve disputes
- [ ] **CS-M10-S08** PATCH `/admin/config` (commission, timeouts)

---

## Piste N — Mobile client · Module M11

- [ ] **CS-M11-S01** Setup Expo Router + design tokens
- [ ] **CS-M11-S02** Écrans auth C01 (OTP) — en attente maquettes
- [ ] **CS-M11-S03** C03 Home + navigation tabs
- [ ] **CS-M11-S04** Parcours booking C04–C07 (formule→créneau)
- [ ] **CS-M11-S05** C08 Paiement Stripe PaymentSheet
- [ ] **CS-M11-S06** C09 Confirmation
- [ ] **CS-M11-S07** C10 Suivi mission (timeline)
- [ ] **CS-M11-S08** C11 Avis
- [ ] **CS-M11-S09** C12 Liste réservations
- [ ] **CS-M11-S10** C13 Profil + adresses
- [ ] **CS-M11-S11** Push notifications client
- [ ] **CS-M11-S12** Google Places autocomplete C06

---

## Piste O — Mobile pro · Module M12

- [ ] **CS-M12-S01** Setup Expo Router pro + tabs — en attente maquettes
- [ ] **CS-M12-S02** Auth P00 OTP
- [ ] **CS-M12-S03** KYC wizard P01 (7 steps)
- [ ] **CS-M12-S04** P02 Liste missions (3 tabs)
- [ ] **CS-M12-S05** P03 Détail + accept/decline
- [ ] **CS-M12-S06** P04 En route + Maps + tel client
- [ ] **CS-M12-S07** P05 Checklist + upload photos
- [ ] **CS-M12-S08** P08 Gains / historique
- [ ] **CS-M12-S09** P07 Planning disponibilités
- [ ] **CS-M12-S10** Stripe Connect onboarding in-app
- [ ] **CS-M12-S11** Push nouvelle mission (high priority)

---

## Piste P — Admin web · Module M13

- [ ] **CS-M13-S01** Setup Next.js + shadcn + auth
- [ ] **CS-M13-S02** A02 Dashboard KPIs
- [ ] **CS-M13-S03** A03 Validation KYC pros
- [ ] **CS-M13-S04** A04 CRUD catalog
- [ ] **CS-M13-S05** A05 Zones + pricing editor
- [ ] **CS-M13-S06** A06 Bookings list + detail + refund
- [ ] **CS-M13-S07** A07 Litiges file + resolve
- [ ] **CS-M13-S08** A09 Settings config plateforme

---

## Piste Q — QA & launch · Module M14

- [ ] **CS-M14-S01** Collection Bruno/Postman API
- [ ] **CS-M14-S02** Tests E2E manuels SC-01 à SC-06
- [ ] **CS-M14-S03** EAS build preview TestFlight + APK
- [ ] **CS-M14-S04** Prod deploy + smoke tests
- [ ] **CS-M14-S05** App Store + Play Store submission
- [ ] **CS-M14-S06** Runbook incident + monitoring alertes

---

## Dette technique / points ouverts

| Sujet | Impact | Décision |
|-------|--------|----------|
| Expo Router retiré des apps mobiles | Navigation à plat pour l'instant | Réintroduire quand les types React seront alignés |
| Port Postgres `5434` au lieu de `5433` | Divergence avec la doc initiale | `5432` et `5433` déjà occupés sur le Mac ; `.env.example` à jour |
| Image `postgis/postgis:16-3.4` en `linux/amd64` | Émulation sur Apple Silicon | Acceptable en local ; image arm64 à évaluer |
| `pnpm.overrides` `@types/react` 18 à la racine | Contraint tout le workspace | À revoir lors du passage React 19 |
