# Contrat API v1 — CARSERVICE

> **Base URL :** `https://api.carservice.fr/api/v1`  
> **Auth :** Bearer JWT · **Format :** JSON · **Version :** 1.0

Référence pour dev mobile, admin et backend. OpenAPI Swagger généré depuis Nest en dev.

---

## Conventions

### Headers communs

```
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
Idempotency-Key: <uuid>          # POST critiques (booking, payment)
X-Request-Id: <uuid>             # optionnel client, sinon généré serveur
```

### Envelope réponse

```json
{ "data": {}, "meta": { "requestId": "uuid" } }
```

### Erreur

```json
{
  "error": {
    "code": "ZONE_NOT_COVERED",
    "message": "Cette adresse n'est pas encore couverte.",
    "details": []
  },
  "meta": { "requestId": "uuid" }
}
```

---

## Auth

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| POST | `/auth/otp/send` | public | Envoyer OTP SMS |
| POST | `/auth/otp/verify` | public | Vérifier OTP → tokens |
| POST | `/auth/admin/login` | public | Login admin email + password |
| POST | `/auth/refresh` | public | Refresh token |
| POST | `/auth/logout` | auth | Invalider refresh |
| GET | `/auth/me` | auth | Profil courant |

### POST `/auth/otp/send`

```json
// Request
{ "phone": "+33612345678", "role": "client" }

// Response 200
{ "data": { "expiresIn": 300, "retryAfter": null } }
```

### POST `/auth/otp/verify`

```json
// Request
{ "phone": "+33612345678", "code": "123456", "acceptTerms": true }

// Response 200
{
  "data": {
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "expiresIn": 86400,
    "user": { "id": "uuid", "role": "client", "phone": "+336...", "email": null }
  }
}
```

> **TTL access :** `86400` (24 h) en local/test (`JWT_ACCESS_TTL_SECONDS`). En production : `900` (15 min).

### POST `/auth/admin/login`

Login back-office (CS-M10-S01). Réservé aux users `role=admin` avec `email` + `password_hash` (scrypt). Rate limit Redis 10 essais / 15 min. Seed local : `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

```json
// Request
{ "email": "admin@carservice.fr", "password": "AdminTest123!" }

// Response 201
{
  "data": {
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "expiresIn": 86400,
    "user": {
      "id": "uuid",
      "role": "admin",
      "phone": "+33600000000",
      "email": "admin@carservice.fr"
    }
  }
}
```

Erreurs : `AUTH_INVALID_CREDENTIALS` (401), `AUTH_RATE_LIMIT` (429), `VALIDATION_ERROR` (400).

---

## Catalog (public / client)

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| GET | `/catalog/categories` | public | Catégories actives |
| GET | `/catalog/offers` | public | Offres wash (?zone=lyon) |
| GET | `/catalog/offers/:id` | public | Détail offre + options |
| POST | `/catalog/quote` | client | Calcul prix live |

### POST `/catalog/quote`

```json
// Request
{
  "offerId": "uuid",
  "vehicleType": "suv",
  "optionIds": ["uuid-pet-hair"],
  "zoneSlug": "lyon",
  "dirtLevel": "normal"
}

// Response 200
{
  "data": {
    "breakdown": {
      "base": 8500,
      "vehicleSurcharge": 1000,
      "options": [{ "id": "uuid", "name": "Poils animaux", "amount": 1500 }],
      "serviceFee": 200,
      "totalCents": 11200,
      "currency": "EUR"
    },
    "durationMinutes": 105
  }
}
```

---

## Addresses & zones

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| GET | `/addresses` | client | Mes adresses |
| POST | `/addresses` | client | Créer adresse |
| PATCH | `/addresses/:id` | client | Modifier |
| DELETE | `/addresses/:id` | client | Supprimer |
| POST | `/zones/check` | public | Vérifier couverture |

### POST `/zones/check`

```json
// Request
{ "lat": 45.764, "lng": 4.835, "postalCode": "69002" }

// Response 200 — couvert
{ "data": { "covered": true, "zone": { "id": "uuid", "name": "Lyon", "slug": "lyon" } } }

// Response 200 — hors zone
{ "data": { "covered": false, "leadCaptured": false } }
```

### POST `/zones/leads`

```json
{ "email": "user@mail.com", "lat": 45.0, "lng": 4.0, "addressText": "..." }
```

---

## Providers (pro)

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| GET | `/providers/me` | provider | Mon profil |
| PATCH | `/providers/me` | provider | Mettre à jour identité publique, bio, méthodes et adresse de base |
| POST | `/providers/kyc/submit` | provider | Soumettre dossier |
| GET | `/providers/kyc/status` | provider | Statut KYC |
| GET | `/providers/kyc/alerts` | provider | Alerte RC Pro J-30 / expirée |
| GET | `/providers/missions/eligibility` | provider | Accès missions (KYC approved + RC Pro valide) |
| POST | `/providers/stripe/onboard` | provider | Lien onboarding Connect |
| GET | `/providers/availability` | provider | Dispo hebdo |
| PUT | `/providers/availability` | provider | Maj dispo |
| GET | `/providers/zones` | provider | Zones d'intervention |
| PUT | `/providers/zones` | provider | Maj zones d'intervention |
| GET | `/providers/capabilities` | provider | Formules proposées |
| PUT | `/providers/capabilities` | provider | Maj capabilities |

### GET `/providers/me`

```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "companyName": "Clean Auto Lyon",
    "siret": "12345678901234",
    "bio": "Lavage écologique sans eau.",
    "avatarUrl": "https://example.com/avatar.jpg",
    "kycStatus": "draft",
    "kycRejectionReason": null,
    "washMethods": ["waterless"],
    "ratingAvg": 0,
    "ratingCount": 0,
    "acceptanceRate": 100,
    "stripeAccountId": null,
    "chargesEnabled": false,
    "baseAddressId": null
  }
}
```

### PATCH `/providers/me`

```json
{
  "companyName": "Clean Auto Lyon",
  "siret": "12345678901234",
  "bio": "Lavage écologique sans eau.",
  "avatarUrl": "https://example.com/avatar.jpg",
  "washMethods": ["waterless"],
  "baseAddressId": "uuid"
}
```

### POST `/providers/kyc/submit`

Règles appliquées : SIRET 14 chiffres, RC Pro obligatoire non expirée, au moins une méthode éco (`waterless` ou `steam`). Transitions autorisées : `draft -> submitted` et `rejected -> submitted`.

```json
{
  "siret": "12345678901234",
  "washMethods": ["waterless"],
  "documents": [
    {
      "docType": "rc_pro",
      "fileUrl": "https://example.com/rc-pro.pdf",
      "expiresAt": "2099-12-31"
    }
  ]
}
```

### GET `/providers/kyc/status`

```json
{
  "data": {
    "status": "submitted",
    "rejectionReason": null,
    "documents": [
      {
        "id": "uuid",
        "docType": "rc_pro",
        "fileUrl": "https://example.com/rc-pro.pdf",
        "expiresAt": "2099-12-31",
        "verifiedAt": null
      }
    ],
    "rcProAlert": null
  }
}
```

`rcProAlert` : `null` si aucune RC Pro ou expiration > 30 jours. Sinon `{ kind: "expiring_soon" | "expired", expiresAt, daysRemaining }` (RG-KYC-02).

### GET `/providers/kyc/alerts`

```json
// Response 200 — J-30
{
  "data": {
    "alert": {
      "kind": "expiring_soon",
      "expiresAt": "2026-10-03",
      "daysRemaining": 30
    }
  }
}
```

```json
// Response 200 — pas d'alerte
{ "data": { "alert": null } }
```

### GET `/providers/missions/eligibility`

Protégé par `KycApprovedGuard`. Réutilisable sur les futures routes missions (`GET /bookings/available`, accept/decline).

Règles : `kycStatus === approved`, RC Pro présente non expirée (fin de journée UTC), et `chargesEnabled === true` (CS-M06-S06). Sinon 403.

```json
// Response 200
{
  "data": {
    "eligible": true,
    "kycStatus": "approved"
  }
}
```

```json
// Response 403 — KYC non approved
{
  "error": {
    "code": "KYC_NOT_APPROVED",
    "message": "Le dossier KYC n'est pas encore approuvé.",
    "details": { "kycStatus": "draft" }
  }
}
```

```json
// Response 403 — RC Pro expirée (RG-KYC-02)
{
  "error": {
    "code": "RC_PRO_EXPIRED",
    "message": "La RC Pro est expirée. Les missions sont bloquées.",
    "details": { "expiresAt": "2026-01-01" }
  }
}
```

```json
// Response 403 — Stripe Connect charges_enabled false
{
  "error": {
    "code": "STRIPE_CHARGES_DISABLED",
    "message": "Le compte Stripe n'est pas encore habilité à encaisser.",
    "details": { "chargesEnabled": false }
  }
}
```

### GET `/providers/capabilities`

```json
{
  "data": {
    "capabilities": [
      {
        "offerId": "uuid",
        "offerSlug": "wash-complete",
        "offerName": "Lavage complet",
        "categorySlug": "wash",
        "isActive": true
      }
    ]
  }
}
```

### PUT `/providers/capabilities`

Les offres hors catégorie `wash` ou inactives sont ignorées en MVP.

```json
{
  "offerIds": ["uuid"]
}
```

### GET `/providers/availability`

```json
{
  "data": {
    "weeklySlots": [
      {
        "id": "uuid",
        "dayOfWeek": 1,
        "startTime": "09:00",
        "endTime": "12:00",
        "isActive": true
      }
    ],
    "blockedSlots": [
      {
        "id": "uuid",
        "startAt": "2026-09-10T09:00:00.000Z",
        "endAt": "2026-09-10T12:00:00.000Z",
        "reason": "Congé"
      }
    ]
  }
}
```

### PUT `/providers/availability`

Règles : au moins une plage hebdomadaire, `endTime > startTime`, pas de chevauchement de plages actives le même jour, et `endAt > startAt` pour les créneaux bloqués.

```json
{
  "weeklySlots": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "12:00",
      "isActive": true
    }
  ],
  "blockedSlots": [
    {
      "startAt": "2026-09-10T09:00:00.000Z",
      "endAt": "2026-09-10T12:00:00.000Z",
      "reason": "Congé"
    }
  ]
}
```

### GET `/providers/zones`

```json
{
  "data": {
    "zones": [
      {
        "zoneId": "uuid",
        "zoneSlug": "lyon",
        "zoneName": "Lyon",
        "radiusKm": 12.5
      }
    ]
  }
}
```

### PUT `/providers/zones`

Règle : seules les zones plateforme actives sont conservées pour l'éligibilité matching.

```json
{
  "zones": [
    {
      "zoneId": "uuid",
      "radiusKm": 12.5
    }
  ]
}
```

### POST `/providers/stripe/onboard`

Crée un compte **Stripe Connect Express** (FR, `card_payments` + `transfers`) s'il n'existe pas encore, persiste `stripeAccountId`, puis retourne un Account Link.

Sans clé Stripe réelle (`STRIPE_SECRET_KEY` vide ou placeholder `sk_test_xxx`), l'API reste utilisable en local : compte `acct_dev_*` et URL mockée vers `returnUrl`.

```json
// Request
{
  "returnUrl": "https://pro.carservice.test/stripe/return",
  "refreshUrl": "https://pro.carservice.test/stripe/refresh"
}

// Response 200
{
  "data": {
    "url": "https://connect.stripe.com/setup/s/acct_xxx",
    "stripeAccountId": "acct_xxx"
  }
}
```

Erreurs : `VALIDATION_ERROR` (URLs invalides), `STRIPE_REQUEST_FAILED` / `STRIPE_ACCOUNT_CREATE_FAILED` / `STRIPE_ACCOUNT_LINK_FAILED` (503).

---

## Bookings

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| POST | `/bookings` | client | Créer + init paiement |
| POST | `/bookings/slots` | client | Créneaux C07 (J→J+14) |
| GET | `/bookings` | client/provider | Liste (filtres status) |
| GET | `/bookings/:id` | client/provider | Détail + timeline |
| PATCH | `/bookings/:id/cancel` | client/provider | Annuler |
| POST | `/bookings/:id/accept` | provider | Accepter mission |
| POST | `/bookings/:id/decline` | provider | Refuser |
| PATCH | `/bookings/:id/status` | provider | en_route, in_progress, completed |
| GET | `/bookings/available` | provider | Missions à accepter |

### POST `/bookings`

```json
// Request
{
  "offerId": "uuid",
  "vehicleType": "suv",
  "optionIds": [],
  "addressId": "uuid",
  "slotStart": "2026-09-06T08:00:00.000Z",
  "clientComment": "Parking B2",
  "clientPhotoIds": []
}

// Response 201
{
  "data": {
    "booking": {
      "id": "uuid",
      "reference": "CS-20260906-A7B2",
      "status": "payment_authorized",
      "pricingSnapshot": { "totalCents": 9700, "currency": "EUR" },
      "slotStart": "...",
      "slotEnd": "..."
    },
    "payment": {
      "clientSecret": "pi_xxx_secret_xxx",
      "paymentIntentId": "pi_xxx"
    },
    "matching": { "broadcastCount": 3 }
  }
}
```

`status` = `pending_provider` si au moins un pro a été notifié, sinon `payment_authorized`.

À la création, l'API ouvre un **PaymentIntent Stripe en capture manuelle** (RG-PAY-01) du montant `pricingSnapshot.totalCents`, persiste la ligne `payments` (`authorized`, split commission RG-PAY-03) et renvoie `clientSecret` pour PaymentSheet. Sans `STRIPE_SECRET_KEY` valide, le PI est mocké (`pi_mock_*`) — même contrat.

Échec Stripe (`STRIPE_REQUEST_FAILED` / `STRIPE_PAYMENT_INTENT_FAILED`, 503) : **aucun booking** n'est créé (RG-PAY-06).

Erreurs : `VALIDATION_ERROR` (400), `ADDRESS_NOT_FOUND` (404), `OFFER_NOT_FOUND` (404), `INVALID_OPTIONS` (400), `ZONE_NOT_COVERED` (400), `SLOT_UNAVAILABLE` (409, délai min zone ou créneau passé), `PAYMENT_AMOUNT_INVALID` (400), `STRIPE_REQUEST_FAILED` / `STRIPE_PAYMENT_INTENT_FAILED` (503).

### POST `/bookings/slots`

JWT client. Calendrier **J → J+14** (C07), créneaux 1 h UTC (08:00–20:00). `available: false` = aucun pro éligible (RG-MATCH-01 : KYC, RC Pro, capability, zone/rayon, dispo hebdo, pas de conflit). Créneaux `< now + minBookingLeadHours` (zone, défaut 2 h) **omis**.

```json
// Request
{
  "offerId": "uuid",
  "vehicleType": "suv",
  "optionIds": [],
  "addressId": "uuid"
}

// Response 200
{
  "data": {
    "durationMinutes": 90,
    "minBookingLeadHours": 2,
    "horizonDays": 14,
    "zone": { "slug": "lyon", "name": "Lyon" },
    "days": [
      {
        "date": "2026-09-16",
        "slots": [
          { "start": "2026-09-16T08:00:00.000Z", "end": "2026-09-16T09:30:00.000Z", "available": true },
          { "start": "2026-09-16T09:00:00.000Z", "end": "2026-09-16T10:30:00.000Z", "available": false }
        ]
      }
    ]
  }
}
```

Erreurs : `ADDRESS_NOT_FOUND` (404), `ZONE_NOT_COVERED` (400), `OFFER_NOT_FOUND` (404), `INVALID_OPTIONS` (400).

### GET `/bookings`

JWT client ou provider. Liste paginée (max 50), tri `slotStart` desc. Hors `draft` par défaut.

Query :

| Param | Valeurs | Description |
|-------|---------|-------------|
| `status` | CSV `BookingStatus` | Filtre exact (prioritaire) |
| `group` | `upcoming` \| `past` \| `cancelled` | Onglets C12 |

`upcoming` = `payment_authorized`, `pending_provider`, `accepted`, `en_route`, `in_progress`  
`past` = `completed`, `disputed`  
`cancelled` = `cancelled_by_client`, `cancelled_by_provider`, `cancelled_by_admin`, `expired`, `unassigned`

Client : ses bookings. Provider : missions **assignées** uniquement (`GET /bookings/available` pour le broadcast).

```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "CS-20260906-A7B2",
      "status": "accepted",
      "slotStart": "...",
      "slotEnd": "...",
      "offerName": "Lavage complet",
      "vehicleType": "suv",
      "totalCents": 9700,
      "currency": "EUR",
      "zone": { "slug": "lyon", "name": "Lyon" },
      "addressSnapshot": { "street": "...", "city": "Lyon", "lat": 45.76, "lng": 4.83 }
    }
  ]
}
```

### GET `/bookings/:id`

JWT client (propriétaire) ou provider (assigné, ou broadcast si `pending_provider`). Timeline = `booking_status_history`.

RG-SEC-02 : `addressSnapshot` et `client.phone` uniquement pour le client propriétaire et le pro **assigné**. Un pro en broadcast voit `addressSnapshot: null` + zone.

```json
{
  "data": {
    "id": "uuid",
    "reference": "CS-20260906-A7B2",
    "status": "accepted",
    "slotStart": "...",
    "slotEnd": "...",
    "offerName": "Lavage complet",
    "vehicleType": "suv",
    "totalCents": 9700,
    "currency": "EUR",
    "zone": { "slug": "lyon", "name": "Lyon" },
    "addressSnapshot": { "street": "...", "city": "Lyon", "lat": 45.76, "lng": 4.83 },
    "clientComment": "Parking B2",
    "providerNotes": null,
    "pricingSnapshot": { "totalCents": 9700, "currency": "EUR" },
    "timeline": [
      { "fromStatus": null, "toStatus": "draft", "actorType": "system", "reason": null, "createdAt": "..." },
      { "fromStatus": "pending_provider", "toStatus": "accepted", "actorType": "provider", "reason": null, "createdAt": "..." }
    ],
    "photos": [],
    "provider": { "companyName": "Marc Wash", "avatarUrl": null, "ratingAvg": 4.8, "washMethods": ["waterless"] },
    "client": { "firstName": "Ada", "lastName": "Lovelace", "phone": "+336..." }
  }
}
```

### GET `/bookings/available`

JWT provider + KYC approved. Missions `pending_provider` du broadcast (top 8, RG-MATCH-03).

```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "CS-20260906-A7B2",
      "slotStart": "...",
      "slotEnd": "...",
      "offerName": "Lavage complet",
      "totalCents": 9700,
      "currency": "EUR",
      "score": 72.5,
      "zone": { "slug": "lyon", "name": "Lyon" }
    }
  ]
}
```

### POST `/bookings/:id/accept`

JWT provider + KYC approved. Premier accept gagne (verrou `FOR UPDATE`, RG-MATCH-03). Réponse : adresse exacte (RG-SEC-02).

```json
{
  "data": {
    "id": "uuid",
    "reference": "CS-20260906-A7B2",
    "status": "accepted",
    "slotStart": "...",
    "slotEnd": "...",
    "offerName": "Lavage complet",
    "totalCents": 9700,
    "currency": "EUR",
    "addressSnapshot": { "street": "...", "city": "Lyon", "lat": 45.76, "lng": 4.83 }
  }
}
```

Erreurs : `BOOKING_NOT_FOUND` (404), `BOOKING_NOT_OFFERED` (403), `BOOKING_ALREADY_ACCEPTED` (409), `CAPABILITY_REQUIRED` (403).

### POST `/bookings/:id/decline`

Retire le pro du broadcast. Le booking reste `pending_provider` pour les autres. Pénalité `acceptanceRate` −1.

```json
// Request (optionnel)
{ "reason": "Créneau trop tôt" }

// Response
{ "data": { "declined": true, "bookingId": "uuid", "remainingBroadcasts": 2 } }
```

### PATCH `/bookings/:id/status`

JWT provider + KYC approved. Pro assigné uniquement. Transitions : `accepted` → `en_route` → `in_progress` → `completed` (RG-BOOK-01/02). Pas de saut.

```json
// Request
{
  "status": "en_route" | "in_progress" | "completed",
  "providerNotes": "Je pars",
  "lat": 45.764,
  "lng": 4.8357
}

// Response 200
{
  "data": {
    "id": "uuid",
    "reference": "CS-20260906-A7B2",
    "status": "en_route",
    "providerNotes": "Je pars",
    "slotStart": "...",
    "slotEnd": "..."
  }
}
```

- `in_progress` : `lat`/`lng` optionnels. S’ils sont fournis, distance ≤ `BOOKING_GEOFENCE_METERS` (200 m, RG-BOOK-03) sinon `BOOKING_GEOFENCE_FAILED` (400).
- `completed` : au moins 2 photos `before` et 2 photos `after` uploadées par le pro (RG-BOOK-04). Media = M07 (`POST /media/upload-url` + `POST /media/confirm`) ; sans le quota → `BOOKING_PHOTOS_REQUIRED` (400). Capture Stripe du PaymentIntent **avant** le passage à `completed` (RG-PAY-02) : commission plateforme = `payments.commission_cents` (20 %, RG-PAY-03). Sans clé / `pi_mock_*` : capture locale. Échec Stripe → le booking reste `in_progress`.

Erreurs : `VALIDATION_ERROR` (400), `BOOKING_NOT_FOUND` (404), `BOOKING_NOT_ASSIGNED` (403), `BOOKING_INVALID_TRANSITION` (409), `BOOKING_GEOFENCE_FAILED` (400), `BOOKING_PHOTOS_REQUIRED` (400), `KYC_NOT_APPROVED` (403), `PAYMENT_NOT_FOUND` / `PAYMENT_NOT_CAPTURABLE` / `PAYMENT_SPLIT_INVALID` (409), `STRIPE_CAPTURE_FAILED` / `STRIPE_REQUEST_FAILED` (503).

**Transitions autorisées :** voir [RG-BOOK](regles-de-gestion.md). Appliquées uniquement côté API (`BookingStateMachine`) — jamais côté mobile.

Fenêtre litige : `completed` → `disputed` par le client pendant **48 h** (`BOOKING_DISPUTE_WINDOW_HOURS`).

### PATCH `/bookings/:id/cancel`

JWT client ou provider. Motif obligatoire côté pro (RG-CANCEL-01). Impossible dès `in_progress` — litige uniquement (RG-CANCEL-02).

```json
// Request
{ "reason": "Empêchement" }

// Response 200
{
  "data": {
    "id": "uuid",
    "reference": "CS-20260906-A7B2",
    "status": "cancelled_by_client",
    "reason": "Empêchement",
    "window": "free" | "mid" | "late",
    "feeCents": 0,
    "refundCents": 9700,
    "currency": "EUR",
    "providerPenalty": 0,
    "rematchUrgent": false
  }
}
```

L’annulation client/pro libère l’auth Stripe (RG-PAY-05) : refund 100 % → cancel PaymentIntent ; frais RG-CANCEL → capture du seul `feeCents`.

| Fenêtre | Délai | Frais |
|---------|-------|-------|
| `free` | > 24 h | 0 % |
| `mid` | 2–24 h | 20 % |
| `late` | < 2 h | 50 % |

Pro : `cancelled_by_provider`, remboursement client 100 %, pénalité `acceptanceRate` 0 / −2 / −5. Si `late`, push `booking.rematch_urgent`.

Erreurs : `BOOKING_CANCEL_REASON_REQUIRED` (400), `BOOKING_FORBIDDEN` (403), `BOOKING_NOT_ASSIGNED` (403), `BOOKING_CANCEL_VIA_DISPUTE` (409), `BOOKING_INVALID_TRANSITION` (409), `BOOKING_NOT_FOUND` (404).

### Jobs matching (BullMQ, pas d’endpoint HTTP)

Queue Redis `matching` (prefix `carservice`), planifiée à la création du booking :

| Job | Délai | Action |
|-----|-------|--------|
| `expand-radius` | T1 = 30 min (`MATCHING_TIMEOUT_T1_MINUTES`) | Élargit le rayon ×2 et notifie plus de pros (RG-MATCH-04). No-op si déjà accepté. |
| `timeout-unassigned` | min(T2 = 2 h, H-2 du créneau) | `pending_provider` / `payment_authorized` → `unassigned` (RG-MATCH-05). No-op sinon. |

Handlers idempotents, retry 3×. Worker désactivé si `NODE_ENV=test` (sauf `MATCHING_WORKER_ENABLED=true`).

---

## Media

Object storage **S3-compatible** (Scaleway Object Storage ou Cloudflare R2). Config Nest `MediaModule` / `S3Service` : `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION` (défaut `fr-par`), `S3_ACCESS_KEY`, `S3_SECRET_KEY`. Sans clés valides : **mock local** (`https://cdn.carservice.test/mock-upload/…`).

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| POST | `/media/upload-url` | auth | Signed URL upload |
| POST | `/media/confirm` | auth | Confirmer upload + attach booking |

### POST `/media/upload-url`

JWT. Génère une URL **PUT presignée** (TTL 15 min). MIME whitelist : `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. Max 10 Mo photo / 5 Mo PDF (`sizeBytes` optionnel). `booking_photo` exige `bookingId` + `photoType` et un accès à la mission (client propriétaire, pro assigné, admin). `kyc_document` : rôle provider uniquement.

```json
// Request
{ "mimeType": "image/jpeg", "context": "booking_photo", "bookingId": "uuid", "photoType": "before" }

// Response 200
{ "data": { "uploadUrl": "https://...", "fileKey": "bookings/{id}/before/{uuid}.jpg", "expiresAt": "..." } }
```

Erreurs : `VALIDATION_ERROR` (400), `FORBIDDEN` (403), `BOOKING_NOT_FOUND` (404).

### POST `/media/confirm`

JWT. Vérifie que l’objet existe (HeadObject S3, no-op en mock local), puis :

- `booking_photo` : crée une ligne `booking_photos` (`uploadedBy` = `client` si rôle client, sinon `provider` — un admin est mappé `provider`). Idempotent sur `fileUrl`.
- `kyc_document` : pas d’écriture `booking_photos` ; `id` / `bookingId` / `photoType` = `null`. Réservé au prestataire propriétaire de la clé.

```json
// Request
{ "fileKey": "bookings/{bookingId}/before/{uuid}.jpg" }

// Response 200 (photo mission)
{
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "photoType": "before",
    "uploadedBy": "client",
    "fileKey": "bookings/{bookingId}/before/{uuid}.jpg",
    "fileUrl": "https://cdn.carservice.test/...",
    "createdAt": "..."
  }
}

// Response 200 (KYC)
{
  "data": {
    "id": null,
    "bookingId": null,
    "photoType": null,
    "uploadedBy": "provider",
    "fileKey": "kyc/{userId}/{uuid}.pdf",
    "fileUrl": "https://cdn.carservice.test/...",
    "createdAt": "..."
  }
}
```

Erreurs : `VALIDATION_ERROR` (400), `MEDIA_FILE_KEY_INVALID` (400), `MEDIA_OBJECT_NOT_FOUND` (400), `FORBIDDEN` (403), `BOOKING_NOT_FOUND` (404).

---

## Reviews

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| POST | `/reviews` | client | Créer avis |
| GET | `/reviews/provider/:id` | public | Avis d'un pro |

### POST `/reviews`

JWT **client**. 1 avis / booking (`REVIEW_ALREADY_EXISTS`). Booking `completed` uniquement (RG-QUAL-04). Fenêtre **72 h** après `completed` (`REVIEW_WINDOW_HOURS`, RG-QUAL-05). Recalcule `provider_profiles.rating_avg` / `rating_count` sur les avis **non masqués** (RG-QUAL-02). Tags : `punctuality`, `quality`, `cleanliness`, `friendliness`.

```json
// Request
{ "bookingId": "uuid", "rating": 5, "comment": "...", "tags": ["quality", "punctuality"] }

// Response 201
{
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "rating": 5,
    "comment": "...",
    "tags": ["quality", "punctuality"],
    "createdAt": "...",
    "provider": { "ratingAvg": 5, "ratingCount": 1 }
  }
}
```

Erreurs : `VALIDATION_ERROR` (400), `REVIEW_BOOKING_NOT_COMPLETED` (400), `FORBIDDEN` (403), `BOOKING_NOT_FOUND` (404), `REVIEW_ALREADY_EXISTS` (409), `REVIEW_WINDOW_EXPIRED` (409), `BOOKING_NOT_ASSIGNED` (409).

### GET `/reviews/provider/:id`

**Public** (pas de JWT). `:id` = `provider_profiles.id`. Liste les avis **non masqués** (RG-QUAL-02), plus récents d’abord. Pas d’identité client. Pagination offset `page` (défaut 1) / `pageSize` (défaut 20, max 50).

```json
// Response 200
{
  "data": {
    "provider": { "id": "uuid", "ratingAvg": 5, "ratingCount": 1 },
    "items": [
      {
        "id": "uuid",
        "rating": 5,
        "comment": "Impeccable",
        "tags": ["quality", "punctuality"],
        "createdAt": "..."
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  },
  "meta": { "page": 1, "pageSize": 20, "total": 1, "requestId": "..." }
}
```

Erreurs : `VALIDATION_ERROR` (400), `PROVIDER_NOT_FOUND` (404).

---

## Disputes

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| POST | `/disputes` | client/provider | Ouvrir litige |
| GET | `/disputes/:id` | auth | Détail |

### POST `/disputes`

JWT **client** (propriétaire) ou **pro assigné**. Booking `completed` uniquement, fenêtre **48 h** (`BOOKING_DISPUTE_WINDOW_HOURS`, RG-DISPUTE-01). 1 litige / booking. Passe le booking en `disputed` et pose `payments.payout_frozen_at` (RG-DISPUTE-03, pas de refund). Motifs : `quality`, `delay`, `damage`, `no_show`, `other`.

```json
// Request
{ "bookingId": "uuid", "reason": "quality", "description": "Prestation incomplète…" }

// Response 201
{
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "openedBy": "client",
    "reason": "quality",
    "description": "…",
    "status": "open",
    "bookingStatus": "disputed",
    "payoutFrozen": true,
    "payoutFrozenAt": "...",
    "createdAt": "..."
  }
}
```

Erreurs : `VALIDATION_ERROR` (400), `FORBIDDEN` (403), `BOOKING_NOT_FOUND` (404), `BOOKING_INVALID_TRANSITION` (409), `BOOKING_DISPUTE_WINDOW_EXPIRED` (409), `DISPUTE_ALREADY_EXISTS` (409), `BOOKING_NOT_ASSIGNED` (409), `PAYMENT_NOT_FOUND` (409).

---

## Notifications

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| POST | `/users/push-token` | client/provider | Enregistrer Expo push token |

### POST `/users/push-token`

JWT **client** ou **provider**. Upsert par `token` (réassigne à l’utilisateur courant si le token existait). Formats acceptés : `ExponentPushToken[...]`, `ExpoPushToken[...]`.

```json
// Request
{ "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]", "platform": "ios" }

// Response 201
{
  "data": {
    "id": "uuid",
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "ios",
    "updatedAt": "..."
  }
}
```

Erreurs : `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403).

Worker **send-push** (BullMQ queue `notifications`, job `send-push`) : lit les `push_tokens` de l’utilisateur et envoie via Expo Push API. Sans `EXPO_ACCESS_TOKEN` → mock console (local/CI).

Jobs **send-sms** / **send-email** (M09-S03) : templates booking (`booking_confirmed`, `provider_assigned`, `booking_completed`, `provider_new_mission`). Email via Brevo (`BREVO_API_KEY`, sinon mock). SMS via Twilio (même credentials OTP, sinon mock).

### Events métier (M09-S04 / RG-NOTIF)

Triggers automatiques (échec notif ≠ échec booking) :

| Événement | Destinataire | Canaux |
|-----------|--------------|--------|
| Broadcast / expansion matching | Pros ciblés | Push + SMS (`provider_new_mission`) |
| Accept (pro trouvé) | Client | Push + SMS + email (`provider_assigned`) |
| Status `en_route` | Client | Push |
| Status `completed` | Client | Push + email (`booking_completed`) |

---

## Payments (webhooks)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/stripe` | Webhooks Stripe (signature HMAC `v1`) |

Pas de JWT. Auth = header `Stripe-Signature` si `STRIPE_WEBHOOK_SECRET` (`whsec_…`) est configuré. Sans secret (local) : body JSON accepté tel quel.

```json
// Request
{
  "id": "evt_xxx",
  "type": "payment_intent.payment_failed",
  "data": { "object": { "id": "pi_xxx" } }
}

// Response 200
{ "data": { "received": true, "duplicate": false } }
```

Traitement **idempotent** via table `stripe_events` (unique `stripe_event_id`). En production la vérif HMAC est obligatoire ; le job BullMQ `process-stripe-webhook` (queue `payments`) applique l’event. En `NODE_ENV=test` le worker est off : traitement inline.

| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Si `payments.status=authorized` → `captured` |
| `payment_intent.payment_failed` | `payments.status=failed` ; booking `payment_authorized` / `pending_provider` → `expired` (RG-PAY-06) |
| `charge.refunded` | `payments.status=refunded` |
| `account.updated` | Sync `provider_profiles.charges_enabled` (CS-M06-S06) |

Erreurs : `STRIPE_WEBHOOK_INVALID_SIGNATURE` (400), `VALIDATION_ERROR` (400).

---

## Admin

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| GET | `/admin/dashboard` | admin | KPIs |
| GET | `/admin/providers/pending` | admin | KYC à valider |
| POST | `/admin/providers/:id/approve` | admin | Approuver KYC |
| POST | `/admin/providers/:id/reject` | admin | Rejeter KYC |
| CRUD | `/admin/catalog/*` | admin | Catégories, offres, options |
| CRUD | `/admin/zones*` | admin | Zones + pricing |
| GET | `/admin/bookings` | admin | Tous bookings |

### Admin catalog (CS-M10-S04)

JWT **admin**. Soft-disable via `isActive` / `isEnabled` (pas de hard delete — bookings historiques intacts).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/catalog/categories` | Toutes catégories (y compris désactivées) |
| PATCH | `/admin/catalog/categories/:id` | Update partiel (`name`, `isEnabled`, …) |
| GET | `/admin/catalog/offers` | Toutes offres + options |
| GET | `/admin/catalog/offers/:id` | Détail offre admin |
| POST | `/admin/catalog/offers` | Créer offre |
| PATCH | `/admin/catalog/offers/:id` | Update / désactiver offre |
| POST | `/admin/catalog/offers/:offerId/options` | Créer option |
| PATCH | `/admin/catalog/options/:id` | Update / désactiver option |

```json
// POST /admin/catalog/offers
{
  "categoryId": "uuid",
  "slug": "wash-premium",
  "name": "Lavage premium",
  "basePriceCents": 12000,
  "durationMinutes": 120,
  "formSchema": { "fields": [] },
  "checklistTemplate": { "items": [] },
  "isActive": true,
  "sortOrder": 10
}

// PATCH /admin/catalog/offers/:id
{ "isActive": false }
```

Erreurs : `CATEGORY_NOT_FOUND` / `OFFER_NOT_FOUND` / `OPTION_NOT_FOUND` (404), `OFFER_SLUG_TAKEN` / `OPTION_SLUG_TAKEN` (409), `VALIDATION_ERROR` (400).

### Admin zones + pricing (CS-M10-S05)

JWT **admin**. Polygone GeoJSON-like `{ lat, lng }[]` (≥ 3 points, ring auto-fermé en WKT `POLYGON((lng lat, …))`). Soft-disable via `isActive`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/zones` | Liste zones + polygones |
| GET | `/admin/zones/:id` | Détail zone |
| POST | `/admin/zones` | Créer zone |
| PATCH | `/admin/zones/:id` | Update partiel / activer |
| GET | `/admin/zones/:id/pricing` | Pricing par offre |
| PUT | `/admin/zones/:id/pricing/:offerId` | Upsert override + surcharges véhicule |

```json
// POST /admin/zones
{
  "name": "Villeurbanne",
  "slug": "villeurbanne",
  "polygon": [
    { "lat": 45.75, "lng": 4.85 },
    { "lat": 45.75, "lng": 4.9 },
    { "lat": 45.8, "lng": 4.9 },
    { "lat": 45.8, "lng": 4.85 }
  ],
  "isActive": false,
  "priceCoefficient": 1.1,
  "minBookingLeadHours": 3
}

// PUT /admin/zones/:id/pricing/:offerId
{
  "priceOverrideCents": 9000,
  "vehicleSurcharges": {
    "citadine": 0,
    "berline": 500,
    "suv": 1000,
    "utilitaire": 1500,
    "moto": 0
  }
}
```

Erreurs : `ZONE_NOT_FOUND` / `OFFER_NOT_FOUND` (404), `ZONE_SLUG_TAKEN` (409), `VALIDATION_ERROR` (400).

### Admin bookings search + refund (CS-M10-S06)

JWT **admin**. Refund déjà livré (M06). Liste + détail pour A06.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/bookings` | Recherche paginée (`q`, `status`, `page`, `pageSize`) |
| GET | `/admin/bookings/:id` | Détail (adresse, client, timeline, paiement) |
| POST | `/admin/bookings/:id/refund` | Remboursement / cancel auth (RG-PAY-05) |

Query `GET /admin/bookings` :
- `q` — référence, téléphone client ou nom société pro (contains, case-insensitive)
- `status` — CSV de statuts RG-BOOK (défaut : tous sauf `draft`)
- `page` / `pageSize` — défaut `1` / `20` (max 50)

```json
// Response 200 GET /admin/bookings
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "reference": "CS-20260916-ABCD",
        "status": "accepted",
        "paymentStatus": "authorized",
        "client": { "firstName": "Alice", "lastName": "Martin", "phone": "+33601020304" },
        "provider": { "id": "uuid", "companyName": "Pro Wash" },
        "totalCents": 9500,
        "currency": "EUR"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

Erreurs : `BOOKING_NOT_FOUND` (404), `VALIDATION_ERROR` (400). Refund : voir `POST /admin/bookings/:id/refund`.

### Admin disputes (CS-M10-S07)

JWT **admin**. File A07 + résolution. Booking reste `disputed` (terminal). Effets paiement :

| Décision | Effet |
|----------|--------|
| `resolved_client` | Refund/cancel auth (montant total) + unfreeze payout |
| `resolved_provider` | Unfreeze payout (pro payé) |
| `resolved_split` | Unfreeze payout (partage manuel documenté dans `notes`) |

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/disputes` | File litiges (`status`, `page`, `pageSize`) — défaut `open,under_review` |
| PATCH | `/admin/disputes/:id/resolve` | Décision admin |

```json
// PATCH /admin/disputes/:id/resolve
{
  "decision": "resolved_client",
  "notes": "Remboursement intégral"
}

// Response 200
{
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "status": "resolved_client",
    "resolutionNotes": "Remboursement intégral",
    "resolvedAt": "2026-09-16T14:00:00.000Z",
    "payoutFrozen": false,
    "paymentStatus": "refunded",
    "refundCents": 9500,
    "paymentAction": "refunded"
  }
}
```

Erreurs : `DISPUTE_NOT_FOUND` (404), `DISPUTE_ALREADY_RESOLVED` (409), `PAYMENT_NOT_FOUND` / `PAYMENT_NOT_REFUNDABLE` (409), `VALIDATION_ERROR` (400).

### GET `/admin/dashboard`

JWT **admin**. KPIs A02 (CS-M10-S02), fenêtres UTC :

| Champ | Définition |
|-------|------------|
| `gmv.dayCents` | Somme `payments.amount_cents` `captured` depuis le début du jour UTC |
| `gmv.weekCents` | Idem sur 7 jours (J-6 → maintenant) |
| `gmv.monthCents` | Idem sur 30 jours (J-29 → maintenant) |
| `gmvLast30Days` | Série journalière (30 points, jours sans capture = 0) |
| `bookingsByStatus` | Comptage tous statuts RG-BOOK (0 inclus) |
| `providerAcceptanceRateAvg` | Moyenne `acceptance_rate` des pros `kyc=approved` |
| `matchingDelayMedianMinutes` | Médiane minutes `pending_provider` → `accepted` (null si aucune) |
| `openDisputes` | Litiges `open` + `under_review` |
| `providersPendingKyc` | Pros `kyc_status=submitted` |

```json
// Response 200
{
  "data": {
    "generatedAt": "2026-09-16T12:00:00.000Z",
    "gmv": {
      "dayCents": 11200,
      "weekCents": 56000,
      "monthCents": 224000,
      "currency": "EUR"
    },
    "gmvLast30Days": [{ "date": "2026-09-15", "amountCents": 11200 }],
    "bookingsByStatus": [{ "status": "completed", "count": 3 }],
    "providerAcceptanceRateAvg": 92.5,
    "matchingDelayMedianMinutes": 18.5,
    "openDisputes": 1,
    "providersPendingKyc": 2
  }
}
```

Erreurs : `UNAUTHORIZED` (401), `FORBIDDEN` (403).

### GET `/admin/providers/pending`

JWT **admin**. File des dossiers KYC `submitted` (CS-M10-S03), tri `updatedAt` ASC.

```json
// Response 200
{
  "data": {
    "total": 1,
    "items": [
      {
        "id": "uuid-provider",
        "userId": "uuid-user",
        "companyName": null,
        "siret": "12345678901234",
        "washMethods": ["waterless"],
        "kycStatus": "submitted",
        "submittedAt": "2026-09-16T10:00:00.000Z",
        "phone": "+33600000002",
        "email": null,
        "documents": [
          {
            "id": "uuid-doc",
            "docType": "rc_pro",
            "fileUrl": "https://cdn.example/rc.pdf",
            "expiresAt": "2027-12-31",
            "verifiedAt": null
          }
        ]
      }
    ]
  }
}
```

### POST `/admin/providers/:id/approve`

JWT **admin**. `submitted` → `approved`, documents `verifiedAt`/`verifiedBy`, notif push (+ email si présent). Ne touche pas `chargesEnabled` (Stripe Connect).

```json
// Response 200
{
  "data": {
    "providerId": "uuid-provider",
    "kycStatus": "approved",
    "rejectionReason": null
  }
}
```

### POST `/admin/providers/:id/reject`

JWT **admin**. Body `{ "reason": "..." }` (min 5). `submitted` → `rejected` + motif, notif push (+ email).

```json
// Request
{ "reason": "RC Pro illisible" }

// Response 200
{
  "data": {
    "providerId": "uuid-provider",
    "kycStatus": "rejected",
    "rejectionReason": "RC Pro illisible"
  }
}
```

Erreurs KYC : `PROVIDER_NOT_FOUND` (404), `KYC_NOT_SUBMITTED` (400), `KYC_ALREADY_APPROVED` / `KYC_ALREADY_REJECTED` (409), `VALIDATION_ERROR` (400).

### POST `/admin/bookings/:id/refund`

JWT **admin**. Remboursement total (RG-PAY-05) : si le paiement est `authorized`, **cancel** du PaymentIntent (libération d’auth) ; s’il est `captured`, **refund** Stripe. Le booking passe à `cancelled_by_admin` si la transition est autorisée (pas `in_progress` / `completed` / `disputed`). Sans `STRIPE_SECRET_KEY` : mock local.

```json
// Request
{ "reason": "Geste commercial" }

// Response 200
{
  "data": {
    "bookingId": "uuid",
    "status": "cancelled_by_admin",
    "paymentStatus": "refunded",
    "refundCents": 9700,
    "currency": "EUR",
    "action": "canceled_authorization"
  }
}
```

`action` : `canceled_authorization` | `refunded` | `partial_capture` | `noop`.

L’annulation client/pro (`PATCH /bookings/:id/cancel`) appelle la même libération : refund 100 % → cancel PI ; frais RG-CANCEL → capture du seul `feeCents` (le reste de l’auth est relâché).

Erreurs : `FORBIDDEN` (403), `BOOKING_NOT_FOUND` (404), `PAYMENT_NOT_FOUND` / `PAYMENT_NOT_REFUNDABLE` (409), `STRIPE_CANCEL_FAILED` / `STRIPE_REFUND_FAILED` / `STRIPE_REQUEST_FAILED` (503).
| GET | `/admin/disputes` | admin | File litiges |
| PATCH | `/admin/disputes/:id/resolve` | admin | Résoudre |
| GET/PATCH | `/admin/config` | admin | Commission, timeouts |

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/health/ready` | DB + Redis check |

---

## Codes erreur métier

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Body invalide |
| `ZONE_NOT_COVERED` | 400 | Hors zone |
| `ADDRESS_NOT_FOUND` | 404 | Adresse cliente introuvable |
| `OFFER_NOT_FOUND` | 404 | Offre inactive ou inconnue |
| `INVALID_OPTIONS` | 400 | Option inactive ou hors offre |
| `KYC_NOT_APPROVED` | 403 | Pro non validé (`draft` / `submitted` / `rejected`) |
| `RC_PRO_EXPIRED` | 403 | RC Pro manquante ou expirée |
| `STRIPE_CHARGES_DISABLED` | 403 | Compte Connect sans `charges_enabled` |
| `BOOKING_INVALID_TRANSITION` | 409 | Transition statut interdite |
| `BOOKING_DISPUTE_WINDOW_EXPIRED` | 409 | Litige hors délai 48 h |
| `REVIEW_BOOKING_NOT_COMPLETED` | 400 | Avis hors mission `completed` |
| `REVIEW_ALREADY_EXISTS` | 409 | Un avis existe déjà pour ce booking |
| `REVIEW_WINDOW_EXPIRED` | 409 | Avis hors délai 72 h |
| `PROVIDER_NOT_FOUND` | 404 | Prestataire introuvable |
| `DISPUTE_ALREADY_EXISTS` | 409 | Un litige existe déjà pour ce booking |
| `BOOKING_ALREADY_ACCEPTED` | 409 | Mission déjà prise |
| `BOOKING_NOT_OFFERED` | 403 | Mission hors broadcast du pro |
| `CAPABILITY_REQUIRED` | 403 | Offre hors capabilities du pro |
| `BOOKING_NOT_FOUND` | 404 | Réservation introuvable |
| `SLOT_UNAVAILABLE` | 409 | Créneau complet |
| `PAYMENT_FAILED` | 402 | Paiement refusé |
| `STRIPE_WEBHOOK_INVALID_SIGNATURE` | 400 | Signature webhook Stripe invalide |
| `PAYMENT_NOT_REFUNDABLE` | 409 | Paiement failed / non remboursable |
| `OTP_RATE_LIMITED` | 429 | Trop de tentatives OTP |

---

## WebSocket (phase 1.5 — optionnel)

```
WS /api/v1/ws/bookings/:id
Auth: token query param
Events: status_changed, provider_location (en_route)
```

MVP peut utiliser polling 10 s ou push only.

---

→ [Guide API](guides/guide-api-backend.md) · [Schéma BDD](schema-base-de-donnees.md)
