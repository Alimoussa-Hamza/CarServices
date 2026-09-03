# Workflows développement par couche

## Nouvel endpoint API

1. Schema Zod → `packages/shared-types`
2. Doc → `docs/api-contrat-v1.md`
3. Module Nest : controller + service + tests
4. Méthode → `packages/api-client`
5. Consommer mobile/admin

## Nouvel écran mobile

1. Wireframe → `docs/wireframes.md`
2. Route Expo Router
3. Hook TanStack Query
4. Composants + `fr.json` copy
5. Test manuel staging

## Migration Prisma

```bash
pnpm --filter api prisma migrate dev --name descriptive_name
# Jamais edit migration mergée
# Seed si catalog/zones
```

## Job BullMQ

1. Queue dans `notifications` ou `matching` module
2. Handler idempotent
3. Retry + dead letter
4. Test avec Redis local

## Feature flag nouvelle catégorie

1. `platform_config.categories_enabled`
2. `RG-EXT-02` — mobile home n’affiche que catégories actives
3. Admin toggle A09

## Pre-PR checklist

```bash
./tools/check-env.sh
pnpm lint && pnpm typecheck && pnpm test
git diff --stat  # < 400 lines?
```
