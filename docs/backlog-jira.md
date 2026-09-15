# Backlog Jira — CARSERVICE MVP

> **Format :** Epic → Module → Story → Task  
> **Convention IDs :** `CS-EP-xx` · `CS-Mxx` · `CS-Mxx-Sxx` · `CS-Mxx-Sxx-Txx`  
> **Import Jira :** [jira-import.csv](backlog/jira-import.csv)

---

## Légende

| Champ | Valeurs |
|-------|---------|
| **Priorité** | P0 (bloquant) · P1 (launch) · P2 (post-MVP) |
| **Points** | Fibonacci : 1, 2, 3, 5, 8, 13 |
| **Sprint** | S0–S12 (2 semaines / sprint, ~10 pts/dev) |
| **Type Jira** | Epic · Story · Task |

---

## Vue synthèse Epics

| Epic ID | Nom | Modules | Points | Sprint cible |
|---------|-----|---------|--------|--------------|
| CS-EP-01 | Fondations & Monorepo | M00, M01 | 34 | S0–S1 |
| CS-EP-02 | Identité & Comptes | M02 | 21 | S1–S2 |
| CS-EP-03 | Catalogue & Géographie | M03 | 26 | S2–S3 |
| CS-EP-04 | Pros & KYC | M04 | 34 | S3–S4 |
| CS-EP-05 | Réservations & Matching | M05 | 55 | S4–S6 |
| CS-EP-06 | Paiements Stripe | M06 | 21 | S5–S6 |
| CS-EP-07 | Médias & Preuves | M07 | 13 | S6 |
| CS-EP-08 | Avis & Litiges | M08 | 13 | S7 |
| CS-EP-09 | Notifications | M09 | 13 | S7 |
| CS-EP-10 | API Admin | M10 | 21 | S7–S8 |
| CS-EP-11 | App Mobile Client | M11 | 55 | S6–S9 |
| CS-EP-12 | App Mobile Pro | M12 | 55 | S7–S10 |
| CS-EP-13 | Admin Web | M13 | 34 | S8–S10 |
| CS-EP-14 | QA & Mise en production | M14 | 21 | S11–S12 |
| CS-EP-15 | Fermeture backend MVP | M15 | 26 | S10 |
| CS-EP-16 | DevOps & Qualité repo | M16 | 16 | S11 |
| | **TOTAL MVP** | | **~416 pts** | **~12 sprints** |

---

# CS-EP-01 — Fondations & Monorepo

## Module M00 — Infrastructure & Monorepo

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M00-S01 | Initialiser monorepo Turborepo + pnpm | P0 | 5 | S0 |
| CS-M00-S02 | Docker Compose local (Postgres+PostGIS, Redis) | P0 | 3 | S0 |
| CS-M00-S03 | CI GitHub Actions (lint, test, build) | P0 | 5 | S0 |
| CS-M00-S04 | Environnements staging (Railway/Render) | P0 | 5 | S0 |
| CS-M00-S05 | Sentry + logging Pino API | P1 | 3 | S1 |
| CS-M00-S06 | Documentation `.env.example` toutes apps | P0 | 2 | S0 |

### CS-M00-S01 — Initialiser monorepo

| Task ID | Task | Assigné | Pts |
|---------|------|---------|-----|
| CS-M00-S01-T01 | Créer `pnpm-workspace.yaml` + `turbo.json` | DevOps | 1 |
| CS-M00-S01-T02 | Scaffold `apps/api` NestJS hello world | Backend | 1 |
| CS-M00-S01-T03 | Scaffold `apps/admin` Next.js 15 | Frontend | 1 |
| CS-M00-S01-T04 | Scaffold `apps/mobile-client` Expo | Mobile | 1 |
| CS-M00-S01-T05 | Scaffold `apps/mobile-provider` Expo | Mobile | 1 |

### CS-M00-S02 — Docker Compose local

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M00-S02-T01 | `docker-compose.yml` PostGIS 16 | 1 |
| CS-M00-S02-T02 | Service Redis 7 | 1 |
| CS-M00-S02-T03 | Script `pnpm db:up` / README setup | 1 |

### CS-M00-S03 — CI GitHub Actions

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M00-S03-T01 | Workflow PR : install, lint, typecheck | 2 |
| CS-M00-S03-T02 | Workflow PR : test + build turbo | 2 |
| CS-M00-S03-T03 | Cache pnpm + turbo remote cache (optionnel) | 1 |

### CS-M00-S04 — Staging

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M00-S04-T01 | Projet Railway/Render API + worker | 2 |
| CS-M00-S04-T02 | Postgres managé staging + PostGIS ext | 2 |
| CS-M00-S04-T03 | Redis staging + variables env | 1 |

---

## Module M01 — Packages partagés

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M01-S01 | Package `@carservice/shared-types` | P0 | 5 | S1 |
| CS-M01-S02 | Package `@carservice/api-client` | P0 | 5 | S1 |
| CS-M01-S03 | Package `@carservice/ui-tokens` | P0 | 3 | S1 |
| CS-M01-S04 | Config ESLint/Prettier partagée | P1 | 2 | S1 |

### CS-M01-S01 — shared-types

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M01-S01-T01 | Enums : BookingStatus, UserRole, KycStatus, VehicleType | 1 |
| CS-M01-S01-T02 | Schemas Zod auth (OTP, tokens) | 1 |
| CS-M01-S01-T03 | Schemas Zod catalog + booking | 2 |
| CS-M01-S01-T04 | Export barrel `index.ts` + build TS | 1 |

### CS-M01-S02 — api-client

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M01-S02-T01 | `apiRequest` wrapper + `ApiError` class | 2 |
| CS-M01-S02-T02 | Module auth + token refresh | 2 |
| CS-M01-S02-T03 | Stubs endpoints catalog, bookings | 1 |

---

# CS-EP-02 — Identité & Comptes

## Module M02 — Auth & Users (API)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M02-S01 | Schéma Prisma users + profiles | P0 | 3 | S1 |
| CS-M02-S02 | Envoi OTP SMS | P0 | 5 | S2 |
| CS-M02-S03 | Vérification OTP + JWT | P0 | 5 | S2 |
| CS-M02-S04 | Refresh token + logout | P0 | 3 | S2 |
| CS-M02-S05 | Guards rôles (client/provider/admin) | P0 | 3 | S2 |
| CS-M02-S06 | Endpoint GET /auth/me | P0 | 2 | S2 |

### CS-M02-S01 — Schéma Prisma users

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M02-S01-T01 | Models `users`, `client_profiles`, `provider_profiles` | 1 |
| CS-M02-S01-T02 | Migration initiale + seed admin | 1 |
| CS-M02-S01-T03 | PrismaService Nest module | 1 |

### CS-M02-S02 — Envoi OTP SMS

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M02-S02-T01 | Intégration Twilio/Brevo SMS | 2 |
| CS-M02-S02-T02 | Table/cache OTP hash + TTL 5 min | 1 |
| CS-M02-S02-T03 | Rate limit Redis 5/10min (RG-SEC) | 2 |

### CS-M02-S03 — Vérification OTP + JWT

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M02-S03-T01 | POST /auth/otp/verify | 2 |
| CS-M02-S03-T02 | Génération access + refresh JWT | 2 |
| CS-M02-S03-T03 | Création auto client_profile à 1ère connexion | 1 |

---

# CS-EP-03 — Catalogue & Géographie

## Module M03 — Catalog & Zones (API)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M03-S01 | Schéma Prisma catalog (categories, offers, options) | P0 | 3 | S2 |
| CS-M03-S02 | Schéma zones + PostGIS polygon | P0 | 5 | S2 |
| CS-M03-S03 | GET catalog offres actives par zone | P0 | 3 | S3 |
| CS-M03-S04 | POST /catalog/quote (calcul prix) | P0 | 5 | S3 |
| CS-M03-S05 | POST /zones/check couverture | P0 | 5 | S3 |
| CS-M03-S06 | POST /zones/leads hors zone | P1 | 2 | S3 |
| CS-M03-S07 | Seed Lyon : 4 formules + options + zone | P0 | 3 | S3 |

### CS-M03-S04 — Calcul prix quote

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M03-S04-T01 | PricingService : base + véhicule + options + zone | 2 |
| CS-M03-S04-T02 | Tests unitaires RG-CAT-02 | 2 |
| CS-M03-S04-T03 | Endpoint + validation Zod | 1 |

### CS-M03-S05 — Zone check

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M03-S05-T01 | GeoService point-in-polygon PostGIS | 3 |
| CS-M03-S05-T02 | Endpoint /zones/check | 1 |
| CS-M03-S05-T03 | Tests avec polygone Lyon seed | 1 |

---

# CS-EP-04 — Pros & KYC

## Module M04 — Providers & KYC (API)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M04-S01 | CRUD profil pro | P0 | 3 | S3 |
| CS-M04-S02 | Wizard KYC submit + documents | P0 | 8 | S4 |
| CS-M04-S03 | Capabilities (formules proposées) | P0 | 3 | S4 |
| CS-M04-S04 | Disponibilités hebdomadaires | P0 | 5 | S4 |
| CS-M04-S05 | Zones intervention pro | P0 | 5 | S4 |
| CS-M04-S06 | Stripe Connect onboarding link | P0 | 5 | S4 |
| CS-M04-S07 | Blocage si KYC non approved | P0 | 3 | S4 |
| CS-M04-S08 | Alerte expiration RC Pro | P1 | 2 | S4 |

### CS-M04-S02 — KYC submit

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M04-S02-T01 | Models `provider_kyc_documents` | 1 |
| CS-M04-S02-T02 | POST /providers/kyc/submit | 2 |
| CS-M04-S02-T03 | Validation SIRET format | 1 |
| CS-M04-S02-T04 | State machine kyc_status | 2 |
| CS-M04-S02-T05 | Tests RG-KYC-01 | 2 |

---

# CS-EP-05 — Réservations & Matching

## Module M05 — Bookings & Matching (API)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M05-S01 | Schéma Prisma bookings + items + history | P0 | 5 | S4 |
| CS-M05-S02 | BookingStateMachine (transitions RG-BOOK) | P0 | 8 | S5 |
| CS-M05-S03 | POST /bookings création + snapshot | P0 | 8 | S5 |
| CS-M05-S04 | MatchingService broadcast pros | P0 | 8 | S5 |
| CS-M05-S05 | Accept / decline mission pro | P0 | 5 | S5 |
| CS-M05-S06 | Transitions en_route, in_progress, completed | P0 | 5 | S6 |
| CS-M05-S07 | Jobs BullMQ timeout T1/T2 | P0 | 5 | S6 |
| CS-M05-S08 | Annulation client/pro (RG-CANCEL) | P0 | 5 | S6 |
| CS-M05-S09 | GET bookings list + detail + timeline | P0 | 3 | S6 |
| CS-M05-S10 | Créneaux disponibles (slot picker API) | P0 | 5 | S5 |

### CS-M05-S02 — State machine

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M05-S02-T01 | Map transitions autorisées | 2 |
| CS-M05-S02-T02 | Guard canTransition(from, to, actor) | 3 |
| CS-M05-S02-T03 | booking_status_history log | 1 |
| CS-M05-S02-T04 | Tests 100% transitions valides/invalides | 2 |

### CS-M05-S04 — Matching

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M05-S04-T01 | Filter eligible : KYC, capability, zone, dispo | 3 |
| CS-M05-S04-T02 | Score distance + rating + acceptance | 2 |
| CS-M05-S04-T03 | Job broadcast + push notification | 2 |
| CS-M05-S04-T04 | Lock transaction premier accept | 1 |

---

# CS-EP-06 — Paiements Stripe

## Module M06 — Payments (API)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M06-S01 | Schéma Prisma payments | P0 | 2 | S5 |
| CS-M06-S02 | PaymentIntent manual capture à booking | P0 | 5 | S5 |
| CS-M06-S03 | Capture à completed + commission | P0 | 5 | S5 |
| CS-M06-S04 | Webhook Stripe idempotent | P0 | 5 | S6 |
| CS-M06-S05 | Refund admin + annulation auth | P1 | 3 | S6 |
| CS-M06-S06 | Sync stripe_account charges_enabled | P0 | 3 | S6 |

### CS-M06-S04 — Webhook Stripe

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M06-S04-T01 | POST /webhooks/stripe signature verify | 2 |
| CS-M06-S04-T02 | Queue process-stripe-webhook | 2 |
| CS-M06-S04-T03 | Store processed event IDs | 1 |

---

# CS-EP-07 — Médias & Preuves

## Module M07 — Media (API)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M07-S01 | Config S3 Scaleway/R2 | P0 | 3 | S6 |
| CS-M07-S02 | POST /media/upload-url presigned | P0 | 5 | S6 |
| CS-M07-S03 | POST /media/confirm + link booking | P0 | 3 | S6 |
| CS-M07-S04 | Validation min photos clôture | P0 | 2 | S6 |

### CS-M07-S02 — Presigned upload

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M07-S02-T01 | S3 client + IAM keys env | 1 |
| CS-M07-S02-T02 | Génération PUT URL TTL 15 min | 2 |
| CS-M07-S02-T03 | MIME whitelist + max size | 2 |

---

# CS-EP-08 — Avis & Litiges

## Module M08 — Reviews & Disputes (API)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M08-S01 | POST /reviews + calcul rating pro | P1 | 3 | S7 |
| CS-M08-S02 | POST /disputes + freeze payout | P1 | 5 | S7 |
| CS-M08-S03 | GET reviews public pro | P1 | 2 | S7 |
| CS-M08-S04 | Fenêtre 72h avis / 48h litige | P1 | 3 | S7 |

---

# CS-EP-09 — Notifications

## Module M09 — Notifications (API)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M09-S01 | Enregistrement expo push token | P1 | 2 | S7 |
| CS-M09-S02 | Worker send-push (Expo API) | P1 | 3 | S7 |
| CS-M09-S03 | SMS + email templates booking | P1 | 5 | S7 |
| CS-M09-S04 | Events : pro trouvé, en route, terminé, nouvelle mission | P1 | 3 | S7 |

---

# CS-EP-10 — API Admin

## Module M10 — Admin API

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M10-S01 | Auth admin (email + role) | P0 | 3 | S7 |
| CS-M10-S02 | GET /admin/dashboard KPIs | P1 | 5 | S8 |
| CS-M10-S03 | Approve/reject KYC | P0 | 3 | S7 |
| CS-M10-S04 | CRUD catalog admin | P0 | 5 | S8 |
| CS-M10-S05 | CRUD zones + pricing | P0 | 5 | S8 |
| CS-M10-S06 | Admin bookings search + refund | P1 | 3 | S8 |
| CS-M10-S07 | Resolve disputes | P1 | 3 | S8 |
| CS-M10-S08 | PATCH /admin/config (commission, timeouts) | P0 | 3 | S8 |

---

# CS-EP-11 — App Mobile Client

## Module M11 — Mobile Client (Expo)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M11-S01 | Setup Expo Router + design tokens | P0 | 3 | S6 |
| CS-M11-S02 | Écrans auth C01 (OTP) | P0 | 5 | S6 |
| CS-M11-S03 | C03 Home + navigation tabs | P0 | 5 | S7 |
| CS-M11-S04 | Parcours booking C04–C07 (formule→créneau) | P0 | 13 | S7–S8 |
| CS-M11-S05 | C08 Paiement Stripe PaymentSheet | P0 | 8 | S8 |
| CS-M11-S06 | C09 Confirmation | P0 | 2 | S8 |
| CS-M11-S07 | C10 Suivi mission (timeline) | P0 | 8 | S8 |
| CS-M11-S08 | C11 Avis | P1 | 3 | S9 |
| CS-M11-S09 | C12 Liste réservations | P1 | 3 | S9 |
| CS-M11-S10 | C13 Profil + adresses | P1 | 3 | S9 |
| CS-M11-S11 | Push notifications client | P1 | 3 | S9 |
| CS-M11-S12 | Google Places autocomplete C06 | P0 | 5 | S8 |

### CS-M11-S04 — Parcours booking C04–C07

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M11-S04-T01 | Layout stepper + routes (booking)/ | 2 |
| CS-M11-S04-T02 | Écran C04 formula — liste offres API | 2 |
| CS-M11-S04-T03 | Écran C05 config — véhicule, options, quote live | 3 |
| CS-M11-S04-T04 | Écran C06 adresse + carte + zone check | 3 |
| CS-M11-S04-T05 | Écran C07 créneau + calendrier | 3 |
| CS-M11-S04-T06 | Zustand booking draft store | 2 |

### CS-M11-S05 — Paiement

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M11-S05-T01 | Intégration @stripe/stripe-react-native | 3 |
| CS-M11-S05-T02 | Écran C08 récap + CGV checkbox | 2 |
| CS-M11-S05-T03 | Flow create booking → PaymentSheet → confirm | 3 |

---

# CS-EP-12 — App Mobile Pro

## Module M12 — Mobile Pro (Expo)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M12-S01 | Setup Expo Router pro + tabs | P0 | 3 | S7 |
| CS-M12-S02 | Auth P00 OTP | P0 | 3 | S7 |
| CS-M12-S03 | KYC wizard P01 (7 steps) | P0 | 13 | S8 |
| CS-M12-S04 | P02 Liste missions (3 tabs) | P0 | 5 | S9 |
| CS-M12-S05 | P03 Détail + accept/decline | P0 | 5 | S9 |
| CS-M12-S06 | P04 En route + Maps + tel client | P0 | 5 | S9 |
| CS-M12-S07 | P05 Checklist + upload photos | P0 | 8 | S10 |
| CS-M12-S08 | P08 Gains / historique | P1 | 5 | S10 |
| CS-M12-S09 | P07 Planning disponibilités | P1 | 5 | S10 |
| CS-M12-S10 | Stripe Connect onboarding in-app | P0 | 5 | S9 |
| CS-M12-S11 | Push nouvelle mission (high priority) | P0 | 3 | S10 |

### CS-M12-S03 — KYC wizard

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M12-S03-T01 | Step 1–2 : société + upload RC Pro | 3 |
| CS-M12-S03-T02 | Step 3–4 : méthodes éco + zones carte | 3 |
| CS-M12-S03-T03 | Step 5–6 : capabilities + dispo | 3 |
| CS-M12-S03-T04 | Step 7 : avatar + submit | 2 |
| CS-M12-S03-T05 | Écran pending + blocage missions | 2 |

---

# CS-EP-13 — Admin Web

## Module M13 — Admin Next.js

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M13-S01 | Setup Next.js + shadcn + auth | P0 | 5 | S8 |
| CS-M13-S02 | A02 Dashboard KPIs | P1 | 5 | S9 |
| CS-M13-S03 | A03 Validation KYC pros | P0 | 5 | S9 |
| CS-M13-S04 | A04 CRUD catalog | P0 | 8 | S9 |
| CS-M13-S05 | A05 Zones + pricing editor | P0 | 8 | S10 |
| CS-M13-S06 | A06 Bookings list + detail + refund | P1 | 5 | S10 |
| CS-M13-S07 | A07 Litiges file + resolve | P1 | 5 | S10 |
| CS-M13-S08 | A09 Settings config plateforme | P0 | 3 | S10 |

### CS-M13-S03 — Validation KYC

| Task ID | Task | Pts |
|---------|------|-----|
| CS-M13-S03-T01 | DataTable pros pending | 2 |
| CS-M13-S03-T02 | Viewer documents PDF/image | 2 |
| CS-M13-S03-T03 | Actions approve/reject + motif | 1 |

---

# CS-EP-14 — QA & Mise en production

## Module M14 — QA & Launch

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M14-S01 | Collection Bruno/Postman API | P1 | 2 | S10 |
| CS-M14-S02 | Tests E2E manuels SC-01 à SC-06 | P0 | 5 | S11 |
| CS-M14-S03 | EAS build preview TestFlight + APK | P0 | 3 | S11 |
| CS-M14-S04 | Prod deploy + smoke tests | P0 | 5 | S11 |
| CS-M14-S05 | App Store + Play Store submission | P0 | 5 | S12 |
| CS-M14-S06 | Runbook incident + monitoring alertes | P1 | 3 | S12 |
| CS-M14-S07 | Cahier de tests API + matrice couverture | P0 | 3 | S10 |
| CS-M14-S08 | Gates E2E M02–M10 + smoke script | P0 | 5 | S10 |
| CS-M14-S09 | CI job `test:e2e` (migrate + seed) | P1 | 3 | S11 |

### Tasks M14 QA API

| ID | Task | Est |
|----|------|-----|
| CS-M14-S07-T01 | Rédiger cahier TC-* (auth→admin) | 3h |
| CS-M14-S07-T02 | Matrice endpoint × TU/E2E/Postman/Smoke | 2h |
| CS-M14-S07-T03 | Procédure exécution + critères sortie release | 1h |
| CS-M14-S08-T01 | Gates e2e m02/m03/m04/m10 isolées | 5h |
| CS-M14-S08-T02 | `tools/smoke-api.sh` health+catalog+zones(+admin) | 2h |
| CS-M14-S08-T03 | Aligner Postman sur contrat v1 | 2h |
| CS-M14-S02-T01 | Exécuter SC-01 happy path client staging | 2h |
| CS-M14-S02-T02 | Exécuter SC-02 pro clôture | 2h |
| CS-M14-S02-T03 | SC-03 à SC-06 edge cases + feuille GO/NOGO | 2h |
| CS-M14-S04-T01 | Smoke staging post-deploy (`smoke-api.sh`) | 1h |
| CS-M14-S09-T01 | Workflow CI e2e Postgres/Redis + seed | 3h |

---

# CS-EP-15 — Fermeture backend MVP

## Module M15 — Backend closure

Cahier : [cahier-fermeture-backend.md](cahier-fermeture-backend.md)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M15-S01 | CRUD `/addresses` | P0 | 5 | S10 |
| CS-M15-S02 | Profil client + suppression RG-SEC-03 | P0 | 5 | S10 |
| CS-M15-S03 | Admin soft-disable users | P1 | 3 | S10 |
| CS-M15-S04 | Sentry + logging Pino API | P1 | 3 | S10 |
| CS-M15-S05 | Helmet + Throttler Nest | P1 | 2 | S10 |
| CS-M15-S06 | Pack QA + smoke + charge k6 | P0 | 5 | S10 |

---

# CS-EP-16 — DevOps & Qualité repo

## Module M16 — DevOps & Quality

Cahier : [cahier-devops-qualite.md](cahier-devops-qualite.md)

| ID | Story | P | Pts | Sprint |
|----|-------|---|-----|--------|
| CS-M16-S01 | Cahier + sync M14 déjà livré | P0 | 2 | S11 |
| CS-M16-S02 | Dockerfile API multi-stage | P0 | 5 | S11 |
| CS-M16-S03 | CI lint + docker build + harden e2e | P0 | 3 | S11 |
| CS-M16-S04 | Templates staging Railway/Render | P1 | 3 | S11 |
| CS-M16-S05 | Runbooks incident + release checklist | P1 | 3 | S11 |

---

## Planning sprints (recommandé)

| Sprint | Focus | Epics | Points ~ |
|--------|-------|-------|----------|
| **S0** | Monorepo + CI + staging | EP-01 | 20 |
| **S1** | Packages + Prisma auth schema | EP-01, EP-02 | 20 |
| **S2** | Auth OTP + catalog schema | EP-02, EP-03 | 20 |
| **S3** | Catalog API + zones + seed | EP-03, EP-04 | 20 |
| **S4** | KYC API + bookings schema | EP-04, EP-05 | 20 |
| **S5** | Bookings + matching + Stripe auth | EP-05, EP-06 | 20 |
| **S6** | Booking lifecycle + media + mobile setup | EP-05, EP-06, EP-07, EP-11 | 20 |
| **S7** | Reviews/notif/admin API + mobile auth/home | EP-08–10, EP-11, EP-12 | 20 |
| **S8** | Mobile booking flow + admin CRUD | EP-11, EP-12, EP-13 | 20 |
| **S9** | Mobile suivi + pro missions + admin KYC | EP-11, EP-12, EP-13 | 20 |
| **S10** | Pro execute + admin zones + polish | EP-12, EP-13 | 20 |
| **S11** | QA E2E + staging hardening | EP-14 | 15 |
| **S12** | Prod launch stores | EP-14 | 10 |

---

## Import Jira

1. Créer projet **CS** (CARSERVICE)
2. Issue types : Epic, Story, Task
3. Importer CSV : [backlog/jira-import.csv](backlog/jira-import.csv)
4. Lier Tasks → Stories → Epics (colonne Parent)
5. Activer Story Points + Sprint field

### Mapping champs Jira

| Colonne CSV | Champ Jira |
|-------------|------------|
| Issue ID | External ID / Summary prefix |
| Issue Type | Issue Type |
| Summary | Summary |
| Epic Link | Epic Link |
| Parent | Parent (Task→Story) |
| Priority | Priority |
| Story Points | Story Points |
| Sprint | Sprint |
| Labels | Labels (module, layer) |
| Description | Description |

---

## Definition of Done

- [ ] Code mergé + PR review
- [ ] Tests passent (unit/intégration selon module)
- [ ] Lint + typecheck OK
- [ ] Contrat API / docs à jour
- [ ] Testé staging si story user-facing
- [ ] Critères acceptation story validés

---

→ [Backlog MVP (stories)](backlog-mvp.md) · [Checklist pré-dev](checklist-pre-developpement.md) · [Contrat API](api-contrat-v1.md)
