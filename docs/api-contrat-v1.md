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
| POST | `/providers/stripe/onboard` | provider | Lien onboarding Connect |
| GET | `/providers/availability` | provider | Dispo hebdo |
| PUT | `/providers/availability` | provider | Maj dispo |
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
    ]
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

---

## Bookings

| Method | Path | Rôle | Description |
|--------|------|------|-------------|
| POST | `/bookings` | client | Créer + init paiement |
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
    }
  }
}
```

### PATCH `/bookings/:id/status`

```json
// Request
{ "status": "en_route" | "in_progress" | "completed", "providerNotes": "..." }

// completed requires photos uploaded separately
```

**Transitions autorisées :** voir [RG-BOOK](regles-de-gestion.md)

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
| `KYC_NOT_APPROVED` | 403 | Pro non validé |
| `BOOKING_INVALID_TRANSITION` | 409 | Transition statut interdite |
| `BOOKING_ALREADY_ACCEPTED` | 409 | Mission déjà prise |
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
