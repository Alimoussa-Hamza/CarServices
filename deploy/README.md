# Playbook staging API — CARSERVICE (CS-M16-S04)

> Cible : API Nest staging (Railway **ou** Render). Postgres PostGIS + Redis managés.  
> Artefacts : [railway.toml](railway.toml) · [render.yaml](render.yaml) · [apps/api/Dockerfile](../apps/api/Dockerfile)

## 1. Prérequis

- Compte Railway **ou** Render
- Repo GitHub connecté
- Stripe **test** keys, Sentry projet (optionnel)
- Redis (Upstash / Railway Redis)

## 2. Variables d’environnement minimales

Copier depuis `apps/api/.env.example` puis renseigner :

| Variable | Staging |
|----------|---------|
| `DATABASE_URL` | Postgres managé (+ extension PostGIS) |
| `REDIS_URL` | Redis managé |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` / `OTP_PEPPER` | Secrets ≥ 32 chars |
| `CORS_ORIGINS` | URLs admin/mobile preview |
| `SENTRY_DSN` | Optionnel |
| `STRIPE_*` | Mode test |
| `NODE_ENV` | `production` |

## 3. Déploiement

### Railway

1. New Project → Deploy from GitHub  
2. Settings → Dockerfile path `apps/api/Dockerfile`, root = monorepo  
3. Ou importer `deploy/railway.toml`  
4. Attacher Postgres (+ activer PostGIS) et Redis  
5. Deploy

### Render

1. New → Blueprint → sélectionner `deploy/render.yaml`  
2. Compléter secrets `sync: false`  
3. Activer PostGIS sur la DB (`CREATE EXTENSION postgis;`)

## 4. Post-deploy

```bash
# Depuis une machine avec DATABASE_URL staging (ou job one-off)
pnpm --filter @carservice/api exec prisma migrate deploy
pnpm --filter @carservice/api prisma:seed   # données démo uniquement

API_URL=https://api-staging.example/api/v1 ./tools/smoke-api.sh
```

## 5. Critères GO staging

- [ ] `GET /health` et `/health/ready` → 200  
- [ ] Smoke vert  
- [ ] Sentry reçoit un event test (si DSN)  
- [ ] Webhook Stripe test enregistré vers `/api/v1/webhooks/stripe`

## 6. Hors scope automatisé

Provision cloud réelle, DNS, certificats — actions console provider.
