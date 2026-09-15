# Guide API / Backend — CARSERVICE

> **Couche :** `apps/api` · **Phase :** spécification pré-développement  
> **Runtime :** NestJS · Prisma · PostgreSQL · Redis · BullMQ

Ce guide décrit **quoi construire et comment structurer** l’API avant d’implémenter.  
Les conventions de code sont dans [standards-developpement.md](../standards-developpement.md).

---

## 1. Rôle de la couche

- **Seule source de vérité métier** (pricing, matching, statuts, KYC)
- Expose REST JSON v1 aux apps mobile + admin
- Reçoit webhooks Stripe
- Orchestre jobs async (matching, notifications)

---

## 2. Modules à implémenter (ordre)

| Ordre | Module | Dépendances | Sprint |
|-------|--------|-------------|--------|
| 1 | `config` + `prisma` + `health` | — | S0 |
| 2 | `auth` (OTP, JWT) | users | S1 |
| 3 | `users` | auth | S1 |
| 4 | `catalog` | zones | S2 |
| 5 | `providers` | auth, media | S2 |
| 6 | `bookings` | catalog, providers, payments | S3–S4 |
| 7 | `payments` | Stripe | S3 |
| 8 | `media` | S3 | S3 |
| 9 | `notifications` | queue | S4 |
| 10 | `reviews` + `disputes` | bookings | S5 |
| 11 | `admin` | all | S5 |

---

## 3. Responsabilités par module

### `auth`
- OTP send/verify (rate limit Redis)
- JWT access (15 min) + refresh (7 j)
- Guards : JwtAuthGuard, RolesGuard

### `catalog`
- CRUD offres/options (admin)
- Quote pricing (RG-CAT-02)
- Zones + check coverage (PostGIS)

### `providers`
- Profil pro, KYC workflow
- Capabilities, availability
- Stripe Connect account link

### `bookings`
- CRUD booking + snapshot
- **BookingStateMachine** (RG-BOOK)
- **MatchingService** (RG-MATCH)
- Jobs : broadcast, timeout

### `payments`
- PaymentIntent manual capture
- Webhook handler idempotent
- Refunds admin

### `media`
- Presigned upload URLs
- Attach photos to booking

### `notifications`
- Push (Expo push tokens), SMS, email via queue

---

## 4. State machine booking (implémentation)

Fichier dédié : `booking-state.machine.ts`

```typescript
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  payment_authorized: ['pending_provider', 'cancelled_by_client'],
  pending_provider: ['accepted', 'unassigned', 'cancelled_by_client'],
  accepted: ['en_route', 'cancelled_by_provider', 'cancelled_by_client'],
  en_route: ['in_progress', 'cancelled_by_provider'],
  in_progress: ['completed'],
  completed: ['disputed'],
  // ...
};
```

Tests unitaires **obligatoires** pour chaque transition valide/invalide.

---

## 5. Matching algorithm (MVP)

```
Input: booking (zone, slot, offer, capabilities needed)
1. Filter providers: kyc=approved, capability, zone overlap, available slot, rc_pro valid
2. Score: distance ASC, rating DESC, acceptance_rate DESC
3. Take top N=8
4. Push notification to each
5. First accept wins (DB transaction + row lock)
6. Schedule job T1 (30min expand), T2 (2h unassigned)
```

---

## 6. Endpoints

Liste complète : [api-contrat-v1.md](../api-contrat-v1.md)

---

## 7. Données & migrations

Schéma : [schema-base-de-donnees.md](../schema-base-de-donnees.md)

**Seed dev obligatoire :**
- 1 zone Lyon (polygone)
- 4 offres wash + options
- 1 admin, 2 pros approved, 1 client
- platform_config (commission 0.20)

---

## 8. Config environnement

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL |
| `REDIS_URL` | yes | Cache + BullMQ |
| `JWT_SECRET` | yes | |
| `JWT_REFRESH_SECRET` | yes | |
| `STRIPE_SECRET_KEY` | yes | |
| `STRIPE_WEBHOOK_SECRET` | yes | |
| `S3_ENDPOINT` | yes (prod) | Object storage S3-compatible ; vide = mock local |
| `S3_BUCKET` | yes (prod) | Bucket privé |
| `S3_REGION` | no | Défaut `fr-par` (Scaleway) |
| `S3_ACCESS_KEY` | yes (prod) | IAM / API key |
| `S3_SECRET_KEY` | yes (prod) | |
| `TWILIO_*` or `BREVO_SMS_*` | yes | OTP |
| `GOOGLE_MAPS_SERVER_KEY` | no | Géocoding serveur |

---

## 9. Observabilité

- **Pino** JSON logs avec `requestId`
- **Sentry** Nest integration
- Metrics : booking_created, matching_duration_ms, payment_capture_fail

---

## 10. Checklist module prêt

- [ ] Endpoints contrat v1 implémentés
- [ ] Validation Zod shared-types
- [ ] Tests state machine / pricing
- [ ] Migration Prisma
- [ ] Swagger doc
- [ ] RG métier respectées (cf. regles-de-gestion.md)

---

→ [Contrat API](../api-contrat-v1.md) · [Intégrations](guide-integrations.md) · [Standards](../standards-developpement.md)
