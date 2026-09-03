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
| G — Backend Pros & KYC (M04) | 2/8 | CS-M04-S03 Capabilities |

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
- [x] TU `ZodValidationPipe` — payload valide / invalide → `VALIDATION_ERROR`
- [x] TU `JwtAuthGuard` + `RolesGuard` — token absent/invalide, rôle refusé
- [x] TU `shared-types` — parse valide/invalide de chaque schéma
- [x] TU `api-client` — fetch wrapper, erreurs, auth endpoints, validation health
- [x] TU `ui-tokens` — couleurs, spacing, radius, typographie
- [x] `pnpm test` branché dans la CI

**Vérifié automatiquement :**
- `@carservice/shared-types` : 49 tests passés
- `@carservice/api` : 50 tests passés
- `@carservice/api-client` : 18 tests passés
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

## Piste F — Apps clientes

- [x] Socle `apps/admin` — Next.js 15, page statut API
- [x] Socle `apps/mobile-client` — Expo SDK 52, écran statut API
- [x] Socle `apps/mobile-provider` — Expo SDK 52, écran statut API
- [ ] **CS-M11-S02** Écran login OTP client (en attente maquettes fournies)
- [ ] **CS-M12-S01** Setup navigation app pro
- [ ] Migration vers Expo Router (bloquée : conflit `@types/react` 18/19 dans le monorepo)

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
- [~] **CS-M04-S03** Capabilities (formules proposées)
- [ ] **CS-M04-S04** Disponibilités hebdomadaires
- [ ] **CS-M04-S05** Zones intervention pro
- [ ] **CS-M04-S06** Stripe Connect onboarding link
- [ ] **CS-M04-S07** Blocage missions si KYC non approved
- [ ] **CS-M04-S08** Alerte expiration RC Pro

**Vérifié manuellement :** OTP provider → `GET /providers/me` → `PATCH /providers/me` avec `companyName`, `siret`, `bio`, `washMethods`.

---

## Dette technique / points ouverts

| Sujet | Impact | Décision |
|-------|--------|----------|
| Expo Router retiré des apps mobiles | Navigation à plat pour l'instant | Réintroduire quand les types React seront alignés |
| Port Postgres `5434` au lieu de `5433` | Divergence avec la doc initiale | `5432` et `5433` déjà occupés sur le Mac ; `.env.example` à jour |
| Image `postgis/postgis:16-3.4` en `linux/amd64` | Émulation sur Apple Silicon | Acceptable en local ; image arm64 à évaluer |
| `pnpm.overrides` `@types/react` 18 à la racine | Contraint tout le workspace | À revoir lors du passage React 19 |
