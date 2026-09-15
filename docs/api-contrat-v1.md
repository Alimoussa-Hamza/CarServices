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
    "expiresIn": 900,
    "user": { "id": "uuid", "role": "client", "phone": "+336..." }
  }
}
```

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

Règles : `kycStatus === approved` et RC Pro présente non expirée (fin de journée UTC). Sinon 403.

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
- `completed` : au moins 1 photo `before` et 1 `after` uploadées par le pro (RG-BOOK-04). Media upload = M07 ; sans photos → `BOOKING_PHOTOS_REQUIRED` (400).

Erreurs : `VALIDATION_ERROR` (400), `BOOKING_NOT_FOUND` (404), `BOOKING_NOT_ASSIGNED` (403), `BOOKING_INVALID_TRANSITION` (409), `BOOKING_GEOFENCE_FAILED` (400), `BOOKING_PHOTOS_REQUIRED` (400), `KYC_NOT_APPROVED` (403).

Erreurs : `VALIDATION_ERROR` (400), `ADDRESS_NOT_FOUND` (404), `OFFER_NOT_FOUND` (404), `INVALID_OPTIONS` (400), `ZONE_NOT_COVERED` (400), `SLOT_UNAVAILABLE` (409, délai min zone ou créneau passé).

Le `pricingSnapshot` est figé à la création (RG-CAT-03). Le `payment` est une **pre-auth mock** tant que M06 (Stripe PaymentIntent) n’est pas branché.

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

Grille client (sur `pricingSnapshot.totalCents`, paiement mock jusqu’à M06) :

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

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| POST | `/media/upload-url` | auth | Signed URL upload |
| POST | `/media/confirm` | auth | Confirmer upload + attach booking |

### POST `/media/upload-url`

```json
// Request
{ "mimeType": "image/jpeg", "context": "booking_photo", "bookingId": "uuid", "photoType": "before" }

// Response
{ "data": { "uploadUrl": "https://...", "fileKey": "...", "expiresAt": "..." } }
```

---

## Reviews

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| POST | `/reviews` | client | Créer avis |
| GET | `/reviews/provider/:id` | public | Avis d'un pro |

```json
// POST /reviews
{ "bookingId": "uuid", "rating": 5, "comment": "...", "tags": ["quality", "punctuality"] }
```

---

## Disputes

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| POST | `/disputes` | client/provider | Ouvrir litige |
| GET | `/disputes/:id` | auth | Détail |

---

## Payments (webhooks)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/stripe` | Webhooks Stripe (signature) |

---

## Admin

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| GET | `/admin/dashboard` | admin | KPIs |
| GET | `/admin/providers/pending` | admin | KYC à valider |
| POST | `/admin/providers/:id/approve` | admin | Approuver KYC |
| POST | `/admin/providers/:id/reject` | admin | Rejeter KYC |
| CRUD | `/admin/catalog/*` | admin | Offres, options, zones |
| GET | `/admin/bookings` | admin | Tous bookings |
| POST | `/admin/bookings/:id/refund` | admin | Remboursement |
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
| `BOOKING_INVALID_TRANSITION` | 409 | Transition statut interdite |
| `BOOKING_DISPUTE_WINDOW_EXPIRED` | 409 | Litige hors délai 48 h |
| `BOOKING_ALREADY_ACCEPTED` | 409 | Mission déjà prise |
| `BOOKING_NOT_OFFERED` | 403 | Mission hors broadcast du pro |
| `CAPABILITY_REQUIRED` | 403 | Offre hors capabilities du pro |
| `BOOKING_NOT_FOUND` | 404 | Réservation introuvable |
| `SLOT_UNAVAILABLE` | 409 | Créneau complet |
| `PAYMENT_FAILED` | 402 | Paiement refusé |
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
