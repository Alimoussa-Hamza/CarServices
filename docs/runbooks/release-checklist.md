# Checklist release API — CARSERVICE

> Avant de déclarer une version API **GO** (staging → prod). Voir aussi [procedure-execution.md](../qa/procedure-execution.md).

## A. Qualité code (automatisé)

- [ ] CI `quality` vert (lint / typecheck / test / build)
- [ ] CI `e2e-api` vert (migrate + seed + gates)
- [ ] CI `docker-api` vert (image build)
- [ ] Aucun secret dans le diff (`rg` `.env`, keys)

## B. Migrations

- [ ] Migrations Prisma reviewées (pas d’edit post-merge)
- [ ] `prisma migrate deploy` testé sur copie staging
- [ ] Plan rollback documenté si migration non triviale

## C. Staging

- [ ] Deploy staging du commit candidat
- [ ] `./tools/smoke-api.sh` vert contre staging
- [ ] (Optionnel) `k6 run tools/load-k6.js` — warn OK, pas de crash
- [ ] Sentry : 0 error S1 nouvelle sur 1 h smoke

## D. Configuration prod

- [ ] Env vars prod = checklist `apps/api/.env.example` (valeurs live)
- [ ] Stripe **live** + webhook prod
- [ ] `SENTRY_DSN` prod
- [ ] `CORS_ORIGINS` = domaines réels
- [ ] `JWT_ACCESS_TTL_SECONDS=900` (pas 86400)

## E. GO / NOGO

| Résultat | Décision |
|----------|----------|
| A+B+C verts, D complet | **GO** tag `vX.Y.Z` + deploy |
| Échec A/B | **NOGO** — corriger sur branche |
| Échec C smoke | **NOGO** — bloquer prod |
| D incomplet | **NOGO** — pas de secrets improvisés |

## F. Après prod

- [ ] Smoke prod (endpoints publics uniquement si OTP réel coûteux)
- [ ] Surveiller Sentry 24 h
- [ ] Noter release dans suivi / changelog
