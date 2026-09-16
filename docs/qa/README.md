# QA API — CARSERVICE

> Référentiel qualité de l’API Nest (`apps/api`) : cahier de tests, matrice de couverture, procédures d’exécution et automatisation.

## Livrables

| Document | Rôle |
|----------|------|
| [cahier-de-tests-api.md](cahier-de-tests-api.md) | Cas de tests (ID, prérequis, steps, attendu, Prio, auto) |
| [matrice-couverture-api.md](matrice-couverture-api.md) | Endpoint × TU / E2E gate / Postman / Smoke |
| [procedure-execution.md](procedure-execution.md) | Comment lancer unit, e2e, smoke, manuels SC |
| [Guide QA](../guides/guide-qa.md) | Stratégie pyramide + scénarios SC-01…SC-06 |

## Pyramide (API)

```
        ┌──────────────────┐
        │ Smoke staging    │  tools/smoke-api.sh
        ├──────────────────┤
        │ E2E module gates │  test/e2e/mxx-*.e2e-spec.ts
        │ + platform-flow  │  test/e2e/platform-flow.e2e-spec.ts
        │ + all-apis       │  test/e2e/all-apis.e2e-spec.ts
        ├──────────────────┤
        │ Unit / intégr.   │  src/**/__tests__/*.spec.ts
        └──────────────────┘
```

**JWT local/test :** access **24 h** (`JWT_ACCESS_TTL_SECONDS=86400`).

## Commandes rapides

```bash
# Unitaires (tous workspaces)
pnpm test

# E2E API (DB réelle + seed requis)
pnpm --filter @carservice/api test:e2e

# Smoke HTTP contre une API déjà up
./tools/smoke-api.sh
API_URL=https://staging.example/api/v1 ./tools/smoke-api.sh

# Auth manuel interactif
./tools/test-auth.sh +33612345678 client
```

## Gate fin de module

Avant d’ouvrir M(n+1), le fichier `apps/api/test/e2e/mxx-*.e2e-spec.ts` doit être vert avec happy path + erreurs P0 du module (voir skill CARSERVICE).

## Statut automatisation (API)

| Module | Gate E2E isolée | Couvert aussi dans platform-flow |
|--------|-----------------|----------------------------------|
| M00 Health | smoke + platform | oui |
| M02 Auth | `m02-auth.e2e-spec.ts` | oui |
| M03 Catalog/Zones | `m03-catalog-zones.e2e-spec.ts` | oui |
| M04 Pros/KYC | `m04-providers-kyc.e2e-spec.ts` | oui |
| M05 Bookings | `m05-bookings.e2e-spec.ts` | oui |
| M06 Payments | `m06-payments.e2e-spec.ts` | oui |
| M07 Media | `m07-media.e2e-spec.ts` | oui |
| M08 Reviews/Disputes | `m08-reviews-disputes.e2e-spec.ts` | oui |
| M09 Notifications | `m09-notifications.e2e-spec.ts` | oui |
| M10 Admin | `m10-admin.e2e-spec.ts` | partiel |
| M11 Mobile client | [m11-client-smoke.md](m11-client-smoke.md) | N/A (app Expo) |
| **ALL** | `all-apis.e2e-spec.ts` | hit exhaustif endpoints |

→ Backlog M14 : [backlog-jira.md](../backlog-jira.md) · Suivi : [suivi-taches.md](../backlog/suivi-taches.md)
