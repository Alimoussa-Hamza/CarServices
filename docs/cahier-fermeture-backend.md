# Cahier de fermeture backend MVP — Module M15

> **Objectif :** clôturer les gaps API restants (users, qualité, charge, hardening, observabilité) avant mobile/admin UI.  
> **Références :** [api-contrat-v1.md](api-contrat-v1.md) · [regles-de-gestion.md](regles-de-gestion.md) · [guide-qa.md](guides/guide-qa.md) · [suivi-taches.md](backlog/suivi-taches.md)

---

## 1. Contexte

Les modules **M02–M10** livrent le cœur métier. Il manque encore :

| Domaine | Gap |
|---------|-----|
| Gestion utilisateur | CRUD `/addresses` (contrat) ; profil client ; RG-SEC-03 anonymisation |
| Ops admin | Soft-disable utilisateurs |
| Observabilité | Sentry + logs structurés (CS-M00-S05 API) |
| Sécurité HTTP | Helmet, throttle global |
| Qualité / charge | Pack QA commit, smoke, k6 50 RPS |

## 2. Non-objectifs

- Déploiement staging/prod cloud (CS-M00-S04)
- Sentry / apps mobile (M11–M12)
- Admin web / écrans Expo (M13 / maquettes)

## 3. Exigences fonctionnelles

### EF-01 Adresses (CS-M15-S01)

- JWT **client** : `GET/POST /addresses`, `PATCH/DELETE /addresses/:id`
- Ownership `userId` ; validation Zod (street, city, postalCode, lat/lng)
- Delete interdit si adresse = `provider_profiles.base_address_id` → `409 ADDRESS_IN_USE`

### EF-02 Profil client + suppression (CS-M15-S02)

- `GET/PATCH /clients/me` : `firstName`, `lastName`
- `DELETE /clients/me` (RG-SEC-03) : `isActive=false`, anonymiser phone/email, révoquer refresh, détacher addresses/push ; **conserver** bookings

### EF-03 Admin users (CS-M15-S03)

- `GET /admin/users?q=&role=&page=&pageSize=`
- `PATCH /admin/users/:id` `{ isActive }`

### EF-04 Observabilité (CS-M15-S04)

- Sentry si `SENTRY_DSN` ; sinon no-op
- Pino JSON en production ; pas de PII dans breadcrumbs

### EF-05 Hardening (CS-M15-S05)

- Helmet ; Throttler global (~100 req/min) ; CORS via `CORS_ORIGINS`

### EF-06 Qualité & charge (CS-M15-S06)

- Docs `docs/qa/` + `tools/smoke-api.sh` + gates e2e stables
- `tools/load-k6.js` : health, catalog, quote, zones/check · 50 RPS / 1 min · seuils p95 guide-qa (warn, non bloquant CI)

## 4. Definition of Done (module)

- [x] Stories S01–S06 cochées + Postman + shared-types + api-client
- [x] `m15-backend-closure.e2e-spec.ts` vert
- [x] Pyramide : unit shared-types / api / api-client + `test:e2e` + build
- [x] `./tools/smoke-api.sh` + `tools/load-k6.js` documentés
- [x] Commits Conventional Commits poussés sur `main`

> Smoke HTTP et k6 restent manuels locaux (API up). Job CI `e2e-api` couvre la gate M15.

## 5. Stories

| ID | Points | Priorité |
|----|--------|----------|
| CS-M15-S01 | 5 | P0 |
| CS-M15-S02 | 5 | P0 |
| CS-M15-S03 | 3 | P1 |
| CS-M15-S04 | 3 | P1 |
| CS-M15-S05 | 2 | P1 |
| CS-M15-S06 | 5 | P0 |
| Gate M15 | 3 | P0 |
