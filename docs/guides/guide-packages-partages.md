# Guide Packages partagés — CARSERVICE

> **Dossier :** `packages/*` · **Rôle :** code partagé entre API, mobile, admin

---

## 1. Packages prévus

| Package | Consommé par | Rôle |
|---------|--------------|------|
| `@carservice/shared-types` | api, mobile-*, admin | Zod schemas, enums, constants |
| `@carservice/api-client` | mobile-*, admin | HTTP client typé |
| `@carservice/ui-tokens` | mobile-*, admin | Colors, spacing, typography |
| `@carservice/mobile-ui` | mobile-* (phase 2) | Composants RN communs |
| `@carservice/eslint-config` | all | ESLint partagé |

---

## 2. `@carservice/shared-types`

### Contenu
```
src/
├── enums/
│   ├── booking-status.ts
│   ├── user-role.ts
│   ├── kyc-status.ts
│   ├── vehicle-type.ts
│   └── photo-type.ts
├── schemas/
│   ├── auth/
│   ├── catalog/
│   ├── booking/
│   ├── provider/
│   └── review/
├── constants/
│   ├── booking.ts          # MAX_PHOTOS, timeouts
│   └── platform-config.ts
└── index.ts
```

### Règles
- **Zéro** import React, Nest, Prisma
- Export public via `index.ts` barrel (contrôlé)
- Version breaking = bump minor monorepo + changelog
- API utilise `.parse()` ; mobile `.safeParse()` + erreurs UI

### Workflow changement schema
1. Modifier schema shared-types
2. Mettre à jour contrat API doc
3. Adapter api + clients
4. PR unique cross-package

---

## 3. `@carservice/api-client`

### Structure
```
src/
├── client.ts              # fetch wrapper, ApiError
├── auth.ts
├── catalog.ts
├── bookings.ts
├── providers.ts
├── media.ts
└── index.ts
```

### Interface cible
```typescript
export const api = {
  auth: { sendOtp, verifyOtp, refresh, me },
  catalog: { getOffers, quote },
  bookings: { create, list, get, cancel },
  // ...
};
```

### Règles
- Base URL injectée au init (`initApiClient({ baseUrl, getToken })`)
- Parse responses critiques avec Zod
- Retry 401 → refresh token once
- Pas de logique métier (pas de calcul prix)

---

## 4. `@carservice/ui-tokens`

Aligné [spec-figma.md](../spec-figma.md) :

```typescript
export const colors = {
  brand: { primary: '#0D6E4F', primaryLight: '#E8F5F0', ... },
  neutral: { ... },
  semantic: { success: '#2E7D4F', error: '#D32F2F', ... },
};

export const spacing = { 2: 4, 3: 8, 5: 16, 7: 24, ... };
export const radius = { sm: 8, md: 12, lg: 16, full: 999 };
export const typography = { ... };
```

Consommé par NativeWind config + admin Tailwind theme.

---

## 5. `@carservice/mobile-ui` (quand créer)

Créer quand **≥ 3 composants** identiques client/pro :
- Button, Input, Card, Avatar, Badge

Avant ça : dupliquer minimal OK pour MVP speed.

---

## 6. Configuration pnpm workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// packages/shared-types/package.json
{
  "name": "@carservice/shared-types",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": { "zod": "^3.23.0" }
}
```

---

## 7. Checklist package prêt

- [ ] `package.json` name scoped `@carservice/*`
- [ ] Export types TS corrects
- [ ] Pas de dépendance circulaire
- [ ] Test unitaire si logique (ex. helpers pricing pure — rare, pricing = API)
- [ ] Documenté dans README package

---

→ [Standards dev](../standards-developpement.md) · [Architecture](../etude-architecture-technique.md)
