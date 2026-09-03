# Guide Intégrations tierces — CARSERVICE

> **Phase :** pré-développement · Comptes, configs, flux, environnements

---

## 1. Vue d’ensemble

| Service | Usage | Env test | Env prod |
|---------|-------|----------|----------|
| **Stripe Connect** | Paiements marketplace | Test keys | Live keys |
| **PostgreSQL** | DB principale | Staging DB | Prod DB |
| **Redis** | Cache, queues | Staging | Prod |
| **Object Storage** | Photos, KYC | Bucket staging | Bucket prod |
| **Google Maps** | Autocomplete, maps | Key dev | Key prod quotas |
| **SMS OTP** | Auth | Sandbox | Prod |
| **Email** | Transactionnel | Sandbox | Prod |
| **Expo Push** | Notifications mobile | Dev | Prod |
| **Sentry** | Errors | Dev project | Prod project |

---

## 2. Stripe Connect

### Type compte pro
**Express** — onboarding simplifié, Stripe gère KYC pro paiement.

### Flux MVP
```
1. Client POST /bookings → PaymentIntent (manual capture)
2. Client confirme PaymentSheet
3. Booking pending_provider
4. Pro clôture → API capture PI + application_fee
5. Transfer vers compte Connect pro
```

### Webhooks à écouter
| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Log (capture confirm) |
| `payment_intent.payment_failed` | Fail booking |
| `account.updated` | Sync charges_enabled pro |
| `charge.refunded` | Update payment status |

### Config
- Dashboard Stripe : Connect settings → Express
- Webhook endpoint : `https://api-staging.carservice.fr/api/v1/webhooks/stripe`
- Idempotency : store event IDs processed

### Test cards
- `4242 4242 4242 4242` — success
- `4000 0000 0000 9995` — decline

---

## 3. Google Maps Platform

### APIs activées
- Places API (Autocomplete)
- Geocoding API
- Maps SDK iOS/Android (mobile)
- Optional : Distance Matrix (matching distance)

### Bonnes pratiques coût
- Session tokens autocomplete (facturation optimisée)
- Debounce 300 ms côté mobile
- Cache côté serveur geocode (Redis TTL 24h)
- Budget alert Google Cloud

### Keys
- **Mobile :** `EXPO_PUBLIC_GOOGLE_MAPS_KEY` (restricted bundle ID)
- **Server :** `GOOGLE_MAPS_SERVER_KEY` (IP restricted)

---

## 4. SMS OTP

### Option A — Twilio
- Verify API ou SMS direct
- Numéro FR ou alphanumeric sender (selon pays)

### Option B — Brevo SMS
- Intégration FR simple, pricing compétitif

### Règles
- Template : "Votre code CARSERVICE : {code}. Valide 5 min."
- Rate limit : 5 req / 10 min / numéro
- Code 6 chiffres, TTL 5 min, hash en DB

---

## 5. Email transactionnel

### Provider : Brevo ou Resend

| Template | Trigger |
|----------|---------|
| `booking_confirmed` | Paiement OK |
| `provider_assigned` | Pro accepté |
| `booking_completed` | Clôture |
| `kyc_approved` / `kyc_rejected` | Admin action |

From : `noreply@carservice.fr` (SPF/DKIM configurés)

---

## 6. Object Storage (Scaleway / R2)

### Buckets
```
carservice-staging-media
carservice-prod-media
```

### Structure keys
```
kyc/{providerId}/{docId}.pdf
bookings/{bookingId}/before/{photoId}.jpg
bookings/{bookingId}/after/{photoId}.jpg
```

### Policy
- Private bucket
- Presigned PUT 15 min TTL
- MIME whitelist : image/jpeg, image/png, image/webp, application/pdf
- Max size : 10 MB photo, 5 MB doc

---

## 7. Expo Push Notifications

1. Client/Pro enregistre `expoPushToken` → `POST /users/push-token`
2. API envoie via Expo Push API depuis worker
3. Payload : `{ title, body, data: { bookingId, type } }`

---

## 8. Sentry

| Project | DSN env |
|---------|---------|
| carservice-api | `SENTRY_DSN_API` |
| carservice-mobile-client | `EXPO_PUBLIC_SENTRY_DSN` |
| carservice-mobile-provider | idem pro |
| carservice-admin | `NEXT_PUBLIC_SENTRY_DSN` |

Release tracking : git SHA via CI.

---

## 9. Matrice secrets par environnement

| Secret | Local | Staging | Prod |
|--------|-------|---------|------|
| Stripe | test | test | live |
| DB | docker | managed | managed |
| Maps | dev key | staging key | prod key |
| SMS | sandbox | sandbox | prod |

**Jamais** commiter `.env` — voir `.env.example` par app.

---

## 10. Checklist intégrations

- [ ] Stripe Connect test : full flow booking → capture
- [ ] Webhook Stripe reçu en staging
- [ ] Upload photo S3 staging OK
- [ ] OTP SMS reçu sur numéro test
- [ ] Push notification reçue device physique
- [ ] Maps autocomplete Lyon fonctionnel

---

→ [Guide API](guide-api-backend.md) · [Guide Infra](guide-infra-devops.md)
