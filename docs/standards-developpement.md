# Standards de développement — CARSERVICE

> **Version :** 1.0  
> **Phase :** **pendant le développement** (conventions code, Git, format)  
> **Avant de coder :** lire d’abord [Checklist pré-dev](checklist-pre-developpement.md) et les [guides par couche](README.md)

Ce document définit les **best practices** et le **format de code** pour chaque couche du monorepo. Toute PR doit s’y conformer.

**Documents complémentaires pré-dev :**
- [Guide API / Backend](guides/guide-api-backend.md) — modules, state machine, env
- [Guide Mobile Client](guides/guide-mobile-client.md) · [Guide Mobile Pro](guides/guide-mobile-pro.md)
- [Guide Admin](guides/guide-admin.md)
- [Guide packages partagés](guides/guide-packages-partages.md)
- [Contrat API v1](api-contrat-v1.md)

---

## 1. Principes globaux

| Principe | Application |
|----------|-------------|
| **TypeScript strict partout** | Pas de `any` sauf exception documentée |
| **Single source of truth** | Schémas Zod dans `packages/shared-types`, consommés par API + mobile + admin |
| **Logique métier côté API** | State machine booking, pricing, matching — jamais dupliqués côté client |
| **Tests systématiques** | Tout nouveau développement ajoute ou met à jour les tests adaptés |
| **Convention over configuration** | Même structure de dossiers dans chaque app |
| **Petites PR** | < 400 lignes nettes, 1 feature ou 1 fix |
| **Français UI / Anglais code** | Textes utilisateur en FR ; code, commits, variables en EN |

---

## 2. Structure monorepo

```
carservice/
├── apps/
│   ├── api/                    # NestJS — REST + webhooks
│   ├── admin/                  # Next.js 15 App Router
│   ├── mobile-client/          # Expo — app Client
│   └── mobile-provider/        # Expo — app Pro
├── packages/
│   ├── shared-types/           # Zod schemas, enums, constants
│   ├── api-client/             # Client HTTP typé (fetch)
│   ├── ui-tokens/              # Design tokens (colors, spacing)
│   └── eslint-config/          # Config ESLint partagée (optionnel)
├── docs/
├── .github/workflows/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

### 2.1 Règles monorepo

- **pnpm** uniquement (pas npm/yarn) — `pnpm install` à la racine
- Dépendances internes : `"@carservice/shared-types": "workspace:*"`
- Scripts racine via Turborepo : `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`
- Pas de code métier dupliqué entre `mobile-client` et `mobile-provider` → extraire dans `packages/`

### 2.2 Fichiers racine obligatoires (à créer à l’init)

| Fichier | Rôle |
|---------|------|
| `.editorconfig` | Indentation, charset, fin de ligne |
| `.nvmrc` | Node 20 LTS |
| `tsconfig.base.json` | Options TS communes |
| `.env.example` | Template variables (sans secrets) |
| `CONTRIBUTING.md` | Lien vers ce doc + workflow Git |

---

## 3. Git & workflow

### 3.1 Branches

| Branche | Usage |
|---------|-------|
| `main` | Production — protégée |
| `develop` | Intégration (optionnel si petite équipe) |
| `feature/CS-123-booking-payment` | Nouvelles features |
| `fix/CS-456-stripe-webhook` | Corrections |
| `chore/update-deps` | Maintenance |

### 3.2 Commits (Conventional Commits)

```
<type>(<scope>): <description courte>

[corps optionnel]
```

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Bug fix |
| `refactor` | Refactoring sans changement comportement |
| `test` | Tests |
| `docs` | Documentation |
| `chore` | Deps, CI, config |
| `perf` | Performance |

**Scopes :** `api`, `admin`, `mobile-client`, `mobile-provider`, `shared-types`, `infra`

**Exemples :**
```
feat(api): add booking state transition guard
fix(mobile-client): prevent double payment on retry
docs: add development standards
```

### 3.3 Pull Request

- Titre = même format que commit principal
- Description : contexte, changements, comment tester
- Checklist : lint ✓ · tests ✓ · pas de secret ✓ · migration Prisma si DB ✓
- 1 review minimum avant merge sur `main`

---

## 4. TypeScript (commun)

### 4.1 `tsconfig.base.json` (recommandé)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

### 4.2 Conventions de nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichiers | kebab-case | `booking.service.ts`, `use-booking.ts` |
| Classes / Types / Enums | PascalCase | `BookingService`, `BookingStatus` |
| Variables / fonctions | camelCase | `createBooking`, `slotStart` |
| Constantes | SCREAMING_SNAKE | `MAX_PHOTOS_BEFORE` |
| DB tables (Prisma) | snake_case | `booking_items` |
| API routes | kebab-case plural | `/api/v1/bookings` |
| Env vars | SCREAMING_SNAKE | `STRIPE_SECRET_KEY` |

### 4.3 Imports

Ordre (ESLint `import/order`) :
1. Node builtins
2. Packages externes
3. `@carservice/*` (workspace)
4. Imports relatifs (`./`, `../`)

Pas d’import circulaire entre modules Nest.

### 4.4 ESLint + Prettier

- **ESLint** : `@typescript-eslint`, règles strictes
- **Prettier** : single quotes, trailing comma `all`, printWidth 100, semi
- **Husky + lint-staged** : lint + format sur fichiers staged pre-commit

---

## 5. Package `shared-types`

**Rôle :** contrats partagés — enums, Zod schemas, constantes métier.

### 5.1 Structure

```
packages/shared-types/
├── src/
│   ├── enums/
│   │   ├── booking-status.ts
│   │   ├── user-role.ts
│   │   └── kyc-status.ts
│   ├── schemas/
│   │   ├── booking/
│   │   │   ├── create-booking.schema.ts
│   │   │   └── booking-response.schema.ts
│   │   ├── catalog/
│   │   └── auth/
│   ├── constants/
│   │   └── platform-config.keys.ts
│   └── index.ts              # re-exports publics
├── package.json
└── tsconfig.json
```

### 5.2 Règles

- **Zod** pour toute validation cross-app
- Exporter le **type inféré** : `export type CreateBookingDto = z.infer<typeof CreateBookingSchema>`
- Pas de dépendance à Nest, React ou Prisma dans ce package
- Versionner les breaking changes (changelog interne)

### 5.3 Exemple

```typescript
// schemas/booking/create-booking.schema.ts
import { z } from 'zod';

export const VehicleTypeSchema = z.enum(['citadine', 'berline', 'suv', 'utilitaire']);

export const CreateBookingSchema = z.object({
  offerId: z.string().uuid(),
  vehicleType: VehicleTypeSchema,
  optionIds: z.array(z.string().uuid()).default([]),
  addressId: z.string().uuid(),
  slotStart: z.string().datetime(),
  clientComment: z.string().max(300).optional(),
});

export type CreateBookingDto = z.infer<typeof CreateBookingSchema>;
```

---

## 6. API — NestJS (`apps/api`)

### 6.1 Structure module (obligatoire)

Chaque domaine = 1 module Nest avec frontières claires :

```
apps/api/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── filters/              # HttpExceptionFilter global
│   ├── guards/               # JwtAuthGuard, RolesGuard
│   ├── interceptors/         # Logging, transform response
│   ├── pipes/                # ZodValidationPipe
│   └── decorators/           # @CurrentUser(), @Roles()
├── config/                   # ConfigModule, env validation
├── modules/
│   ├── auth/
│   ├── users/
│   ├── catalog/
│   ├── providers/
│   ├── bookings/
│   ├── payments/
│   ├── reviews/
│   ├── disputes/
│   ├── notifications/
│   ├── media/
│   └── admin/
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

**Structure d’un module :**

```
modules/bookings/
├── bookings.module.ts
├── bookings.controller.ts
├── bookings.service.ts
├── booking-state.machine.ts      # logique transitions RG-BOOK
├── booking-matching.service.ts
├── dto/                          # thin wrappers si besoin Nest
├── entities/                     # types Prisma mappés (optionnel)
└── __tests__/
    ├── bookings.service.spec.ts
    └── booking-state.machine.spec.ts
```

### 6.2 Best practices NestJS

| Règle | Détail |
|-------|--------|
| Controller mince | Délègue au service ; pas de logique métier |
| Service = use cases | 1 méthode publique = 1 action métier |
| State machine isolée | `booking-state.machine.ts` — transitions RG-BOOK testées unitairement |
| Validation | `ZodValidationPipe` + schemas `shared-types` |
| Auth | `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('provider')` |
| Erreurs | Exceptions Nest typées ; jamais stack trace en prod |
| Transactions | `prisma.$transaction()` pour booking + payment + history |
| Idempotency | Header `Idempotency-Key` sur POST critiques (booking, payment) |
| Webhooks Stripe | Controller dédié, signature vérifiée, handler async via queue |

### 6.3 Format API REST

**Base URL :** `/api/v1`

**Réponse succès :**

```json
{
  "data": { ... },
  "meta": { "requestId": "uuid" }
}
```

**Réponse liste paginée :**

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 142,
    "requestId": "uuid"
  }
}
```

**Réponse erreur :**

```json
{
  "error": {
    "code": "BOOKING_INVALID_TRANSITION",
    "message": "Cannot transition from pending_provider to completed",
    "details": []
  },
  "meta": { "requestId": "uuid" }
}
```

| Code HTTP | Usage |
|-----------|-------|
| 200 | GET, PATCH succès |
| 201 | POST création |
| 204 | DELETE |
| 400 | Validation / règle métier |
| 401 | Non authentifié |
| 403 | Rôle insuffisant |
| 404 | Ressource absente |
| 409 | Conflit (ex. double accept mission) |
| 422 | Entité non traitable |
| 429 | Rate limit OTP |
| 500 | Erreur serveur (loggée Sentry) |

**Codes erreur métier :** `SCREAMING_SNAKE` — ex. `ZONE_NOT_COVERED`, `KYC_NOT_APPROVED`

### 6.4 Exemple controller

```typescript
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles('client')
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const dto = CreateBookingSchema.parse(body);
    return this.bookingsService.create(user.id, dto);
  }

  @Patch(':id/status')
  @Roles('provider')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
  ) {
    const dto = UpdateBookingStatusSchema.parse(body);
    return this.bookingsService.transition(id, user.id, dto);
  }
}
```

### 6.5 Jobs & queues (BullMQ)

| Queue | Jobs |
|-------|------|
| `matching` | `broadcast-booking`, `expand-radius`, `timeout-unassigned` |
| `notifications` | `send-push`, `send-sms`, `send-email` |
| `payments` | `process-stripe-webhook`, `reconcile-payments` |

- Handlers **idempotents**
- Retry avec backoff ; dead-letter après N échecs
- Pas de logique métier lourde dans le controller webhook

### 6.6 Tests API

| Type | Cible | Outil |
|------|-------|-------|
| Unit | Services, state machine, pricing | Jest |
| Integration | Controllers + DB test | Jest + Supertest + DB test container |
| E2E | Flow booking complet | Optionnel phase 2 |

Couverture minimale MVP : **state machine booking**, **pricing**, **matching eligibility**.

---

## 7. Base de données — Prisma

### 7.1 Structure

```
apps/api/prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

### 7.2 Conventions schema.prisma

```prisma
// Naming
model Booking {          // PascalCase model
  id        String   @id @default(uuid()) @db.Uuid
  status    BookingStatus
  createdAt DateTime @default(now()) @map("created_at")
  clientId  String   @map("client_id") @db.Uuid

  client ClientProfile @relation(fields: [clientId], references: [id])

  @@map("bookings")     // snake_case table
  @@index([clientId, status])
}
```

| Règle | Détail |
|-------|--------|
| PK | UUID v4 partout (sauf lookup tables) |
| Timestamps | `createdAt`, `updatedAt` sur toutes les tables métier |
| Soft delete | `deletedAt` optionnel — pas sur bookings (audit) |
| JSON snapshot | `pricingSnapshot Json` pour immutabilité catalogue |
| Migrations | 1 migration = 1 changement logique ; jamais edit une migration mergée |
| Seed | Données dev : 1 zone Lyon, 4 offres wash, 2 pros, 1 admin |

### 7.3 Requêtes

- Pas de `$queryRaw` sauf PostGIS (geo) — commenter la requête
- Select explicite : éviter `include` profond non contrôlé
- Pagination : cursor-based si listes longues ; offset OK MVP admin

### 7.4 PostGIS

```sql
-- Migration raw pour extension
CREATE EXTENSION IF NOT EXISTS postgis;
```

Requêtes distance via service dédié `GeoService`.

---

## 8. Mobile — Expo (`apps/mobile-client` & `apps/mobile-provider`)

### 8.1 Structure (Expo Router)

```
apps/mobile-client/
├── app/                        # File-based routing
│   ├── _layout.tsx
│   ├── index.tsx               # C03 Home
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── verify-otp.tsx
│   ├── (booking)/
│   │   ├── _layout.tsx         # Stepper header
│   │   ├── formula.tsx         # C04
│   │   ├── config.tsx          # C05
│   │   ├── address.tsx         # C06
│   │   ├── slot.tsx            # C07
│   │   ├── payment.tsx         # C08
│   │   └── confirmation.tsx    # C09
│   ├── bookings/
│   │   ├── index.tsx           # C12
│   │   └── [id].tsx            # C10/C11
│   └── profile.tsx             # C13
├── src/
│   ├── components/
│   │   ├── ui/                 # Button, Input, Card…
│   │   └── booking/            # ServiceOfferCard, Stepper…
│   ├── hooks/
│   │   ├── use-booking-draft.ts
│   │   └── use-auth.ts
│   ├── services/
│   │   └── api.ts              # @carservice/api-client
│   ├── stores/
│   │   └── booking-draft.store.ts
│   ├── lib/
│   │   └── query-client.ts
│   └── constants/
├── assets/
├── app.config.ts
└── eas.json
```

**`mobile-provider`** : même structure, routes `(missions)/`, `(kyc)/`.

### 8.2 Best practices mobile

| Règle | Détail |
|-------|--------|
| Server state | **TanStack Query** — cache, retry, invalidation |
| UI state local | **Zustand** (draft booking, wizard step) |
| Forms | **React Hook Form** + Zod resolver (`shared-types`) |
| Navigation | Expo Router — pas de navigation impérative sauf deep links |
| Styles | **NativeWind** (Tailwind) + tokens `@carservice/ui-tokens` |
| i18n | Fichiers `fr.json` — clés `booking.step.payment` |
| Images | `expo-image` ; upload via signed URL API |
| Secure storage | Tokens JWT dans `expo-secure-store` |
| Pas de secrets | Clés API maps via env EAS, pas hardcodées |

### 8.3 Conventions composants

```typescript
// components/booking/service-offer-card.tsx
type ServiceOfferCardProps = {
  offer: ServiceOffer;
  onSelect: (offerId: string) => void;
  testID?: string;
};

export function ServiceOfferCard({ offer, onSelect, testID }: ServiceOfferCardProps) {
  // ...
}
```

| Règle | Détail |
|-------|--------|
| 1 composant / fichier | Nom fichier = nom composant kebab-case |
| Props typées | Interface `XxxProps` exportée si réutilisable |
| Pas de fetch dans composant | Hooks Query dédiés |
| testID | Sur éléments interactifs critiques (E2E Detox phase 2) |

### 8.4 Hooks Query (pattern)

```typescript
// hooks/use-create-booking.ts
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBookingDto) => api.bookings.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
```

**Query keys :** `['bookings']`, `['bookings', id]`, `['catalog', 'offers', zoneSlug]`

### 8.5 Différences Client vs Pro

| | mobile-client | mobile-provider |
|---|---------------|-----------------|
| Routes | `(booking)/`, `bookings/` | `(missions)/`, `(kyc)/` |
| Role API | `client` | `provider` |
| Shared | `packages/ui` components, `api-client`, `shared-types` |

Extraire composants communs dans `packages/mobile-ui` si > 3 composants identiques.

### 8.6 Tests mobile

| Type | Outil |
|------|-------|
| Unit hooks/utils | Jest |
| Composants | React Native Testing Library |
| E2E | Detox ou Maestro (phase 2) |

---

## 9. Admin — Next.js (`apps/admin`)

### 9.1 Structure (App Router)

```
apps/admin/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Dashboard A02
│   ├── (auth)/login/page.tsx
│   ├── providers/
│   │   ├── page.tsx                # A03 liste
│   │   └── [id]/page.tsx
│   ├── catalog/
│   ├── bookings/
│   ├── disputes/
│   └── settings/
├── components/
│   ├── ui/                         # shadcn/ui
│   └── data-table/
├── lib/
│   ├── api.ts
│   └── auth.ts
└── middleware.ts                   # Protect routes
```

### 9.2 Best practices Next.js

| Règle | Détail |
|-------|--------|
| Server Components par défaut | `'use client'` seulement si interactivité |
| Data fetching | Server Components → API Nest direct ; Client → TanStack Query |
| Auth | Cookie httpOnly session ou JWT côté server ; middleware protection |
| UI | shadcn/ui + tokens ; pas de CSS inline |
| Tables | `@tanstack/react-table` + pagination server-side |
| Forms admin | React Hook Form + Zod |

### 9.3 Pages = écrans CDC

| Route admin | Écran CDC |
|-------------|-----------|
| `/` | A02 Dashboard |
| `/providers` | A03 Validation pros |
| `/catalog` | A04 Catalogue |
| `/zones` | A05 Zones & pricing |
| `/bookings` | A06 Bookings |
| `/disputes` | A07 Litiges |
| `/reviews` | A08 Modération |
| `/settings` | A09 Config |

---

## 10. Package `api-client`

```
packages/api-client/
├── src/
│   ├── client.ts           # fetch wrapper, auth header, errors
│   ├── endpoints/
│   │   ├── bookings.ts
│   │   ├── catalog.ts
│   │   └── auth.ts
│   └── index.ts
```

```typescript
// client.ts — pattern
export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getToken()}`,
      ...options?.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new ApiError(body.error.code, body.error.message, res.status);
  }

  return body.data as T;
}
```

- Typage retour via schemas Zod `.parse()` quand critique
- Utilisé par mobile + admin (pas par Nest)

---

## 11. Sécurité (toutes couches)

| Sujet | Règle |
|-------|-------|
| Secrets | `.env` gitignored ; `.env.example` documenté |
| JWT | Access 15 min · Refresh 7 jours · rotation |
| OTP | Rate limit 5/min · expiration 5 min |
| Upload | Signed URL TTL 15 min · MIME whitelist image/*, application/pdf |
| Logs | Jamais logger PAN, OTP, tokens, IBAN |
| CORS | Whitelist domaines admin + mobile dev |
| Headers | Helmet sur Nest ; CSP sur admin |
| Dépendances | Dependabot / Renovate ; audit hebdo |

---

## 12. Variables d’environnement

### 12.1 Naming & fichiers

```
apps/api/.env.example
apps/admin/.env.example
apps/mobile-client/.env.example
```

| App | Préfixe public | Secret |
|-----|----------------|--------|
| API | — | `STRIPE_SECRET_KEY`, `DATABASE_URL` |
| Admin | `NEXT_PUBLIC_API_URL` | `ADMIN_SESSION_SECRET` |
| Mobile | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | — (pas de secrets côté mobile) |

### 12.2 Validation au boot

Nest : `@nestjs/config` + Zod schema env  
Expo : `app.config.ts` lit `process.env.EXPO_PUBLIC_*`

---

## 13. Observabilité

| Couche | Outil |
|--------|-------|
| Erreurs | Sentry (api, admin, mobile) |
| Logs API | JSON structuré (pino) — `requestId`, `userId`, `duration` |
| Métriques | Health `/api/v1/health` ; Prometheus phase 2 |
| Analytics produit | PostHog (events : `booking_created`, `payment_success`) |

**Format log :**

```json
{
  "level": "info",
  "msg": "Booking created",
  "requestId": "uuid",
  "bookingId": "uuid",
  "clientId": "uuid"
}
```

---

## 14. CI/CD (GitHub Actions)

```yaml
# Pipeline minimal
on: [pull_request, push to main]

jobs:
  lint:     pnpm lint
  typecheck: pnpm typecheck
  test:     pnpm test
  build:    pnpm build
```

| Étape | Détail |
|-------|--------|
| PR | lint + test + build obligatoires |
| Merge main | deploy staging auto |
| Tag `v*` | deploy prod + EAS mobile (manual approval) |

---

## 15. Documentation code

| Élément | Quand documenter |
|---------|------------------|
| JSDoc | Fonctions publiques packages, state machine transitions |
| README par app | Setup local, scripts, env vars |
| ADR | Décisions archi majeures (`docs/adr/001-monolith.md`) |
| OpenAPI | Auto-généré Nest Swagger → `/api/docs` |

Pas de commentaires évidents ; commenter le **pourquoi** métier (ex. RG-CANCEL).

---

## 16. Checklist par type de changement

### Nouvelle feature API
- [ ] Schema Zod dans `shared-types`
- [ ] Module Nest + tests unit state machine si booking
- [ ] Tests unitaires/intégration ajoutés ou mis à jour pour le nouveau comportement
- [ ] Migration Prisma si DB
- [ ] OpenAPI à jour
- [ ] Endpoint consommé dans `api-client`

### Nouvel écran mobile
- [ ] Route Expo Router
- [ ] Composants UI réutilisables
- [ ] Hook Query/Mutation
- [ ] Tests ajoutés ou mis à jour pour hooks/comportements critiques
- [ ] Textes dans `fr.json`
- [ ] Aligné wireframe CDC

### Changement règle métier
- [ ] Mise à jour `docs/regles-de-gestion.md`
- [ ] Tests correspondants

---

## 17. Anti-patterns interdits

| ❌ Interdit | ✅ À la place |
|-------------|---------------|
| Logique pricing côté mobile | API calcule + snapshot |
| Transition statut booking côté client | API state machine |
| `any` non justifié | Types Zod inférés |
| Fetch direct sans api-client | `@carservice/api-client` |
| Secrets dans repo | CI secrets + .env local |
| God service 2000 lignes | Split par use case |
| Microservice prématuré | Module Nest isolé |

---

## 18. Références

- [Étude architecture](etude-architecture-technique.md)
- [Schéma BDD](schema-base-de-donnees.md)
- [Règles de gestion](regles-de-gestion.md)
- [Spec Figma](spec-figma.md) — tokens UI
