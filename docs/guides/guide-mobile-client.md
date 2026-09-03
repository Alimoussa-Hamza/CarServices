# Guide Mobile Client — CARSERVICE

> **App :** `apps/mobile-client` · **Stack :** Expo · Expo Router · TanStack Query

Guide **pré-développement** : écrans, navigation, intégrations, critères de done.

---

## 1. Objectif app

Permettre à un particulier de **réserver et payer un lavage à domicile** en < 2 minutes, puis **suivre la mission** jusqu’à l’avis.

---

## 2. Écrans MVP (mapping CDC)

| Route Expo | Écran CDC | Priorité |
|------------|-----------|----------|
| `app/index.tsx` | C03 Home | P0 |
| `app/(booking)/formula.tsx` | C04 Catalogue | P0 |
| `app/(booking)/config.tsx` | C05 Config | P0 |
| `app/(booking)/address.tsx` | C06 Adresse | P0 |
| `app/(booking)/slot.tsx` | C07 Créneau | P0 |
| `app/(booking)/payment.tsx` | C08 Paiement | P0 |
| `app/(booking)/confirmation.tsx` | C09 Confirmation | P0 |
| `app/bookings/[id].tsx` | C10 Suivi | P0 |
| `app/bookings/[id]/review.tsx` | C11 Avis | P1 |
| `app/bookings/index.tsx` | C12 Liste | P1 |
| `app/(auth)/login.tsx` | C01 Auth | P0 |
| `app/profile.tsx` | C13 Profil | P2 |

---

## 3. Navigation

```
Root Stack
├── (auth) — non connecté
├── (tabs) — connecté
│   ├── index (Home)
│   ├── bookings
│   └── profile
└── (booking) — modal stack ou stack full avec stepper
    ├── formula → config → address → slot → payment → confirmation
```

**Stepper header** visible sur `(booking)/*` — 5 étapes.

---

## 4. State management

| Donnée | Solution |
|--------|----------|
| Session auth | SecureStore + Context |
| Draft booking (wizard) | Zustand `useBookingDraftStore` |
| Catalog, bookings, user | TanStack Query |
| Prix live | Mutation `useQuote` debounced 300ms |

**Draft booking shape :** aligné `CreateBookingSchema` (shared-types)

---

## 5. Intégrations natives

| SDK | Usage |
|-----|-------|
| `@stripe/stripe-react-native` | PaymentSheet C08 |
| `react-native-maps` | Pin adresse C06 |
| Google Places Autocomplete | C06 (via API ou SDK) |
| `expo-image-picker` | Photos optionnelles C05 |
| `expo-notifications` | Push statuts |
| `expo-location` | “Utiliser ma position” |

---

## 6. App config

```typescript
// app.config.ts
export default {
  name: 'CARSERVICE',
  slug: 'carservice-client',
  scheme: 'carservice',
  ios: { bundleIdentifier: 'fr.carservice.client' },
  android: { package: 'fr.carservice.client' },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    googleMapsKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
  },
};
```

---

## 7. Deep links

| Link | Écran |
|------|-------|
| `carservice://bookings/:id` | Suivi mission |
| `carservice://booking/formula` | Start réservation |

---

## 8. Offline & erreurs

- Pas de réservation offline (paiement requis)
- Cache catalog 15 min (Query staleTime)
- Banner réseau global si offline
- Retry automatique Query (3×)

---

## 9. Analytics events (PostHog)

| Event | Properties |
|-------|------------|
| `booking_started` | source: home|formula |
| `booking_step_completed` | step, offerId |
| `booking_payment_success` | bookingId, amount |
| `booking_cancelled` | reason |

---

## 10. Checklist app Client prête store

- [ ] Parcours P0 complet staging
- [ ] Privacy manifest iOS / Data safety Android
- [ ] Compte démo pour review Apple/Google
- [ ] CGU accessibles in-app
- [ ] Icône + splash brandés
- [ ] Crash-free > 99 % (Sentry beta)

---

→ [Wireframes](../wireframes.md) · [Contrat API](../api-contrat-v1.md) · [Guide Pro](guide-mobile-pro.md)
