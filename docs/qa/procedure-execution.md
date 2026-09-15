# Procédure d’exécution des tests API

## 1. Prérequis locaux

```bash
./tools/check-env.sh
pnpm db:up                    # Postgres 5434 + Redis 6380
cp apps/api/.env.example apps/api/.env   # si besoin
pnpm --filter @carservice/api prisma:generate
pnpm --filter @carservice/api exec prisma migrate deploy
pnpm --filter @carservice/api prisma:seed
```

Variables minimales dans `apps/api/.env` : `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `OTP_PEPPER`. Stripe/S3 vides = mocks locaux.

---

## 2. Pyramide — commandes

### 2.1 Unitaires

```bash
pnpm test
# ciblé :
pnpm --filter @carservice/api test
pnpm --filter @carservice/shared-types test
pnpm --filter @carservice/api-client test
```

### 2.2 E2E (gates + platform-flow)

```bash
pnpm --filter @carservice/api test:e2e
# un fichier :
pnpm --filter @carservice/api test:e2e -- m05-bookings
pnpm --filter @carservice/api test:e2e -- m02-auth
```

Durée typique : quelques minutes (`--runInBand`). Les phones E2E sont uniques (`+336…{timestamp}`) pour éviter les collisions.

### 2.3 Smoke HTTP (API déjà démarrée)

```bash
pnpm --filter @carservice/api dev   # terminal 1
./tools/smoke-api.sh               # terminal 2
```

Variables optionnelles :

| Var | Défaut | Rôle |
|-----|--------|------|
| `API_URL` | `http://localhost:3000/api/v1` | Base |
| `SMOKE_ADMIN_EMAIL` | — | Active login admin |
| `SMOKE_ADMIN_PASSWORD` | — | Active login admin |

### 2.4 Charge k6 (CS-M15-S06)

```bash
# Prérequis : k6 installé (brew install k6), API up + seed
k6 run tools/load-k6.js
```

Scénario : ~50 RPS / 1 min sur health, catalog, quote, zones/check.  
Seuils p95 guide-qa (catalog &lt; 200 ms, quote &lt; 300 ms) en **warn** (`abortOnFail: false`) — non bloquant CI MVP.

### 2.5 Auth interactif

```bash
./tools/test-auth.sh +33612345678 client
```

### 2.6 Postman

Importer `docs/postman/carservice.postman_collection.json`. Variable `baseUrl` = `http://localhost:3000/api/v1`.

---

## 3. Gate fin de module (DoD)

Pour chaque module Mxx livré :

1. Gate isolée `apps/api/test/e2e/mxx-*.e2e-spec.ts` verte.  
2. Unitaires du module verts.  
3. Contrat API + Postman à jour.  
4. Lignes cahier/matrice mises à jour.  
5. Commit gate **avant** ouverture M(n+1).

---

## 4. Campagne manuelle SC-01…SC-06 (staging)

| Étape | Responsable | Artefact |
|-------|-------------|----------|
| Préparer seed staging + Stripe test | DevOps | comptes test |
| Exécuter SC-01…SC-06 ([guide-qa](../guides/guide-qa.md)) | QA | feuille de résultats |
| Noter GO/NOGO + bugs S1–S4 | QA | ticket / suivi |
| Smoke staging | QA | `./tools/smoke-api.sh` |

Feuille minimale par SC :

```
SC-0X | Date | Env | Exécuteur | Résultat GO/NOGO | Bugs | Preuves (IDs booking)
```

---

## 5. CI

| Job | Contenu |
|-----|---------|
| `quality` | install · prisma generate · **lint** · typecheck · `pnpm test` · build |
| `e2e-api` | Postgres/Redis · migrate · seed · `test:e2e` (gates M02–M15 + platform-flow) |
| `docker-api` | `docker build -f apps/api/Dockerfile` (no push) |

Ne pas merger une PR qui casse `pnpm test`, `e2e-api` ou `docker-api`. Smoke + k6 restent **locaux** (API runtime requis).

Release GO/NOGO : [release-checklist.md](../runbooks/release-checklist.md) · Incidents : [incident-api.md](../runbooks/incident-api.md).

---

## 6. Triage échecs

| Symptôme | Cause fréquente | Action |
|----------|-----------------|--------|
| Seed catalogue manquant | migrate/seed oublié | `prisma:seed` |
| Redis connection | daemon down / mauvais port | `pnpm db:up` · check `.env` |
| Flaky phone unique | collision rare | relancer (suffix timestamp) |
| Stripe réel appelé | clé test dans `.env` | vider `STRIPE_*` pour mock |
| 403 KYC | pro non approved | helper `submitAndApproveKyc` |

Sévérités : [guide-qa.md](../guides/guide-qa.md) §8 · Process bug : `.cursor/skills/carservice-dev/bug-resolution.md`.
