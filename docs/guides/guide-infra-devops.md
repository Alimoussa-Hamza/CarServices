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

```yaml
# docker-compose.yml (racine)
services:
  postgres:
    image: postgis/postgis:16-3.4
    ports: ['5432:5432']
    environment:
      POSTGRES_DB: carservice
      POSTGRES_USER: carservice
      POSTGRES_PASSWORD: dev
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
```

API : `pnpm --filter api dev` (hot reload Nest)

---

## 5. CI/CD — GitHub Actions

### Pipeline PR
```yaml
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - pnpm install
      - pnpm lint
      - pnpm typecheck
      - pnpm test
      - pnpm build
```

### Deploy staging (push main)
- API → Railway auto-deploy
- Admin → Vercel preview/production
- Mobile → EAS build manual ou tag

### Deploy production
- Tag semver `v1.0.0`
- Approval manuelle GitHub Environment
- Migrations Prisma `migrate deploy` pre-deploy

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

```json
// eas.json
{
  "build": {
    "development": { "developmentClient": true },
    "preview": { "distribution": "internal" },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

| Profile | Usage |
|---------|-------|
| development | Simulators + dev client |
| preview | TestFlight / internal APK |
| production | Store release |

OTA updates : Expo Updates pour JS-only fixes (pas native modules).

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
