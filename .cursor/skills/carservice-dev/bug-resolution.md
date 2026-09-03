# Résolution de bugs — CARSERVICE

> Process obligatoire pour l’agent IA et les développeurs.

---

## 1. Classification sévérité

| Sev | Critère | SLA fix | Exemple |
|-----|---------|---------|---------|
| **S1** | Prod down, data leak, paiement double | < 4 h | Double capture Stripe |
| **S2** | Feature MVP bloquée | < 24 h | Impossible réserver |
| **S3** | Dégradation partielle | Sprint courant | Typo, UI glitch |
| **S4** | Cosmétique | Backlog | Alignement pixel |

---

## 2. Process en 8 étapes

### Étape 1 — Reproduire
- Environnement : local / staging / prod
- Rôle : client / pro / admin
- Steps exacts (Given/When/Then)
- Logs : `requestId`, booking ID, Sentry issue

```bash
# Collecte env
./tools/check-env.sh
# Logs API (local)
pnpm --filter api logs  # ou docker logs
```

### Étape 2 — Isoler la couche

| Symptôme | Couche probable |
|----------|-----------------|
| 4xx/5xx API | `apps/api` |
| UI wrong but API OK | mobile / admin |
| Webhook Stripe | `payments` module + queue |
| Matching lent | `bookings` + Redis + BullMQ |
| Upload photo fail | `media` + S3 credentials |
| OTP non reçu | `auth` + Twilio/Brevo |

### Étape 3 — Vérifier règles métier
Consulter [regles-de-gestion.md](../../docs/regles-de-gestion.md) — le bug est parfois une **RG non implémentée**, pas une régression.

### Étape 4 — Cause racine (5 Whys)
Documenter dans ticket :
```
Symptôme → Cause immédiate → Cause racine → Fix
```

### Étape 5 — Fix minimal
- Pas de refactor opportuniste dans un fix bug
- 1 PR = 1 bug (sauf même root cause)

### Étape 6 — Test régression
| Couche | Action |
|--------|--------|
| State machine | Test unit transition |
| Pricing | Test unit quote |
| API | Supertest endpoint |
| Mobile | Repro manuel + RNTL si récurrent |

### Étape 7 — Commit & PR
```
fix(api): prevent double booking accept under concurrent requests

Use transaction row lock on booking accept (RG-MATCH-03).
Closes CS-XXX
```

### Étape 8 — Post-mortem (S1/S2 uniquement)
- Timeline
- Root cause
- Action préventive (test, monitoring, doc)

---

## 3. Bugs fréquents & diagnostics

### Booking / matching

| Bug | Check |
|-----|-------|
| Mission visible 2 pros | Lock transaction accept ? RG-MATCH-03 |
| Timeout unassigned | Jobs BullMQ T1/T2 running ? Redis up ? |
| Statut incohérent | State machine — transitions invalides loggées ? |

### Paiement Stripe

| Bug | Check |
|-----|-------|
| Pre-auth OK, pas capture | Webhook `payment_intent.succeeded` ? completed trigger ? |
| Double charge | Idempotency-Key sur POST /bookings ? |
| Pro pas payé | `charges_enabled` sur Connect account ? |

### Mobile

| Bug | Check |
|-----|-------|
| Token expired loop | Refresh token flow api-client |
| PaymentSheet fail | `clientSecret` expiré ? test card 4242 |
| Maps blank | `EXPO_PUBLIC_GOOGLE_MAPS_KEY` + restrictions bundle |

### KYC / auth

| Bug | Check |
|-----|-------|
| Pro voit missions sans KYC | Guard `kyc_status === approved` |
| OTP rate limit | Redis rate limiter RG-SEC |

---

## 4. Outils debug

```bash
# Stripe webhooks local
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

# Redis CLI
docker exec -it carservice-redis redis-cli

# Prisma studio
pnpm --filter api prisma studio

# BullMQ dashboard (si configuré)
# /admin/queues
```

---

## 5. Template ticket bug (Jira/GitHub)

```markdown
## Environnement
- OS: macOS / staging / prod
- App: client | pro | admin | api
- Version / commit:

## Steps to reproduce
1.
2.
3.

## Expected (RG / CDC)
...

## Actual
...

## Logs / Sentry
requestId: 
bookingId:

## Severity
S1 | S2 | S3 | S4
```

---

## 6. Quand escalader

- Fuite données personnelles → stop, notifier, pas de fix à l’aveugle
- Bug Stripe prod argent réel → Stripe dashboard + support
- Corruption DB → pas de migration destructive sans backup
