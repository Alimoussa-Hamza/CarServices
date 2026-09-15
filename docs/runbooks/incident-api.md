# Runbook — Incidents API CARSERVICE

> Usage : on-call / lead tech. Complète [guide-infra-devops.md](../guides/guide-infra-devops.md) §8.

## 1. Sévérité

| Sev | Exemple | SLA ack | Action |
|-----|---------|---------|--------|
| S1 | Paiement double, fuite PII, API down | 15 min | Page + rollback |
| S2 | Booking/matching cassé, OTP down | 1 h | Fix hotfix |
| S3 | Latence p95 dégradée, 5xx sporadiques | 24 h | Ticket |
| S4 | Cosmétique logs / doc | Sprint | Backlog |

## 2. Triage rapide (5 min)

1. **Uptime** : `GET /api/v1/health` et `/health/ready`  
2. **Sentry** : nouveaux issues depuis le dernier deploy  
3. **Provider** : Railway/Render status + métriques CPU/RAM  
4. **Dépendances** : Postgres, Redis, Stripe, S3, Twilio  
5. **Dernier deploy** : commit hash, migrations Prisma

## 3. Actions par symptôme

| Symptôme | Checks | Mitigation |
|----------|--------|------------|
| 5xx massifs | Sentry + logs Pino | Rollback deploy précédent |
| `/health/ready` fail DB | Connexion `DATABASE_URL`, disk PG | Scale / restore backup |
| OTP fail | Redis + Twilio | Mode mock local seulement ; staging : check SID |
| Webhooks Stripe fail | Signature, `STRIPE_WEBHOOK_SECRET` | Rejouer events Stripe CLI |
| 429 clients | Throttle `THROTTLE_LIMIT` | Hausser temporairement + IP ban abus |
| Queue BullMQ stuck | Redis memory / workers | Restart worker, purge jobs poison |

## 4. Rollback

1. Provider → redeploy previous successful image/commit  
2. **Ne pas** rollback une migration destructive sans plan DBA  
3. Smoke : `API_URL=… ./tools/smoke-api.sh`  
4. Communiquer statut (Slack/status page)

## 5. Post-mortem (S1/S2)

Template :

```
Date / sev / durée
Impact utilisateurs
Timeline
Root cause
Correctifs
Actions préventives (owner + date)
```

## 6. Contacts / outils

- Sentry projet API  
- Dashboard Railway/Render  
- Stripe Dashboard (test/live)  
- Repo : branche `main`, workflow CI
