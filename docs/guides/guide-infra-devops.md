# Guide Infra & DevOps — CARSERVICE

> **Phase :** pré-développement · Environnements, CI/CD, déploiement, monitoring

---

## 1. Environnements

| Env | Usage | URL exemple |
|-----|-------|-------------|
| **local** | Dev machine | `localhost:3000` API |
| **staging** | QA, demos, TestFlight | `api-staging.carservice.fr` |
| **production** | Utilisateurs réels | `api.carservice.fr` |

**Règle :** staging = copie prod (même archi, données anonymisées, Stripe test).

---

## 2. Architecture déploiement MVP

```
                    ┌─────────────┐
                    │   Vercel    │  admin Next.js
                    └──────┬──────┘
                           │
┌──────────┐         ┌─────▼─────┐         ┌──────────┐
│  Expo    │  HTTPS  │  Railway  │         │ Managed  │
│  Mobile  │────────►│  Nest API │◄───────►│ Postgres │
└──────────┘         │  + Worker │         │ + PostGIS│
                     └─────┬─────┘         └──────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           Redis      Object S3     Stripe
```

**Alternative :** Render, Fly.io, Scaleway — même pattern.

---

## 3. Services managés recommandés

| Service | Provider | Tier MVP |
|---------|----------|----------|
| API + Worker | Railway | Hobby/Pro |
| PostgreSQL | Railway / Neon / Scaleway | 1 GB |
| Redis | Upstash / Railway | 256 MB |
| Object storage | Scaleway / R2 | 10 GB |
| Admin | Vercel | Hobby |
| DNS | Cloudflare | Free |
| CDN | Cloudflare | Free |

---

## 4. Docker local (dev)

```bash
pnpm db:up   # Postgres 5434 + Redis 6380 (docker-compose.yml)

# Image API (optionnel, CS-M16)
docker build -f apps/api/Dockerfile -t carservice-api:local .
docker compose -f docker-compose.yml -f docker-compose.api.yml up --build
```

API hot-reload : `pnpm --filter @carservice/api dev`

---

## 5. CI/CD — GitHub Actions

### Pipeline PR / main ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml))

| Job | Contenu |
|-----|---------|
| `quality` | lint · typecheck · test · build (+ Postgres/Redis services) |
| `e2e-api` | migrate · seed · `test:e2e` |
| `docker-api` | build image `apps/api/Dockerfile` |

### Deploy staging

Playbook détaillé : [deploy/README.md](../../deploy/README.md)  
Templates : [deploy/railway.toml](../../deploy/railway.toml) · [deploy/render.yaml](../../deploy/render.yaml)

### Deploy production

- Tag semver `v1.0.0`
- Approval manuelle GitHub Environment
- Migrations Prisma `migrate deploy` pre-deploy
- Checklist : [docs/runbooks/release-checklist.md](../runbooks/release-checklist.md)

---

## 6. Migrations & seed

| Env | Command |
|-----|---------|
| Local | `pnpm --filter api prisma migrate dev` |
| Staging/Prod | `prisma migrate deploy` (CI step) |
| Seed dev only | `prisma db seed` |

**Jamais** `migrate dev` en prod.

---

## 7. Mobile — EAS

Fichiers : `apps/mobile-client/eas.json` · `apps/mobile-provider/eas.json`  
Runbook : [eas-preview.md](../runbooks/eas-preview.md)

| Profile | Usage |
|---------|-------|
| development | Simulators + dev client |
| preview | APK interne + iOS store (TestFlight via `eas submit`) |
| production | Store release (N18) |

OTA updates : Expo Updates pour JS-only fixes (pas native modules). SDK **52** figé.

---

## 8. Monitoring & alerting

| Signal | Outil | Alerte |
|--------|-------|--------|
| Errors 5xx | Sentry | Slack/email |
| API latency p95 | Railway metrics | > 2s |
| Queue depth | BullMQ metrics | > 100 |
| DB connections | PG metrics | > 80% |
| Stripe webhook fail | Sentry + log | immédiat |
| Uptime | Better Stack / UptimeRobot | downtime |

---

## 9. Backups

| Asset | Fréquence | Rétention |
|-------|-----------|-----------|
| PostgreSQL | Daily auto | 30 j |
| Object storage | Versioning | 90 j |
| Secrets | Doppler/git ignored | — |

Test restore : 1×/trimestre staging.

---

## 10. Domaines & SSL

```
carservice.fr          → marketing (phase 2)
api.carservice.fr      → API prod
api-staging.carservice.fr
admin.carservice.fr    → admin prod
```

SSL : Let's Encrypt via Cloudflare ou provider hosting.

---

## 11. Runbook déploiement prod (checklist)

- [ ] Migrations appliquées
- [ ] Env vars prod vérifiées
- [ ] Stripe live keys (pas test)
- [ ] Webhook prod enregistré Stripe
- [ ] Health check OK
- [ ] Smoke test : OTP → booking → capture test interne
- [ ] Rollback plan : previous Railway deployment

---

## 12. Coûts infra estimés

Voir [business-plan-y1.md](../business-plan-y1.md) — 100–300 €/mois MVP.

---

→ [Intégrations](guide-integrations.md) · [Sécurité](guide-securite-conformite.md)
