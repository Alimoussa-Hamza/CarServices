# Index documentation officielle — Stack CARSERVICE

> **Hub central** : lien doc officielle pour **chaque** technologie du projet.  
> Versions épinglées → [versions.md](versions.md) · Setup Mac → `../../tools/check-env.sh`

---

## Accès rapide par couche

| Couche | Ancre |
|--------|-------|
| Monorepo & tooling | [#monorepo--tooling](#monorepo--tooling) |
| Langages & runtime | [#langages--runtime](#langages--runtime) |
| Backend API | [#backend--appsapi](#backend--appsapi) |
| Base de données | [#base-de-données](#base-de-données) |
| Mobile Expo | [#mobile--appsmobile-client--mobile-provider](#mobile--appsmobile-client--mobile-provider) |
| Admin web | [#admin--appsadmin](#admin--appsadmin) |
| Packages partagés | [#packages-partagés](#packages-partagés) |
| Infrastructure | [#infrastructure--devops](#infrastructure--devops) |
| Intégrations & services | [#intégrations--services-externes](#intégrations--services-externes) |
| Observabilité | [#observabilité](#observabilité) |
| Tests | [#tests](#tests) |
| Dev local Mac | [#environnement-dev-mac](#environnement-dev-mac) |
| Doc projet (interne) | [#documentation-projet-interne](#documentation-projet-interne) |

---

## Tableau récap — toutes les technos

| Techno | Version | Documentation officielle |
|--------|---------|--------------------------|
| Node.js | 20 LTS | https://nodejs.org/docs/latest-v20.x/api/ |
| pnpm | 9.15 | https://pnpm.io/ |
| Turborepo | 2.x | https://turbo.build/repo/docs |
| TypeScript | 5.7 | https://www.typescriptlang.org/docs/ |
| NestJS | 11 | https://docs.nestjs.com/ |
| Prisma | 6 | https://www.prisma.io/docs |
| PostgreSQL | 16 | https://www.postgresql.org/docs/16/ |
| PostGIS | 3.4 | https://postgis.net/documentation/ |
| Redis | 7 | https://redis.io/docs/ |
| BullMQ | 5 | https://docs.bullmq.io/ |
| Zod | 3.23 | https://zod.dev/ |
| Stripe Connect | API latest | https://docs.stripe.com/connect |
| AWS SDK S3 | 3.x | https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/ |
| Expo SDK | 52 | https://docs.expo.dev/ |
| React Native | 0.76 | https://reactnative.dev/docs/getting-started |
| React | 19 | https://react.dev/learn |
| Next.js | 15 | https://nextjs.org/docs |
| TanStack Query | 5 | https://tanstack.com/query/latest |
| Docker | 28+ | https://docs.docker.com/ |
| Google Maps | — | https://developers.google.com/maps/documentation |

---

## Monorepo & tooling

### pnpm
| Ressource | Lien |
|-----------|------|
| Documentation | https://pnpm.io/ |
| Workspaces (monorepo) | https://pnpm.io/workspaces |
| CLI | https://pnpm.io/cli/add |
| Compatibilité Node | https://r.pnpm.io/comp |
| Guide projet | [standards §2](../standards-developpement.md) |

### Turborepo
| Ressource | Lien |
|-----------|------|
| Documentation | https://turbo.build/repo/docs |
| Getting started | https://turbo.build/repo/docs/getting-started |
| Configuration `turbo.json` | https://turbo.build/repo/docs/reference/configuration |
| Caching | https://turbo.build/repo/docs/core-concepts/caching |

### ESLint
| Ressource | Lien |
|-----------|------|
| Documentation | https://eslint.org/docs/latest/ |
| TypeScript ESLint | https://typescript-eslint.io/getting-started/ |
| Rules | https://eslint.org/docs/latest/rules/ |

### Prettier
| Ressource | Lien |
|-----------|------|
| Documentation | https://prettier.io/docs/en/ |
| Options | https://prettier.io/docs/en/options |
| Playground | https://prettier.io/playground/ |

### Husky + lint-staged
| Ressource | Lien |
|-----------|------|
| Husky | https://typicode.github.io/husky/ |
| lint-staged | https://github.com/lint-staged/lint-staged |

---

## Langages & runtime

### Node.js
| Ressource | Lien |
|-----------|------|
| Documentation API v20 | https://nodejs.org/docs/latest-v20.x/api/ |
| Guides | https://nodejs.org/en/learn |
| Releases | https://nodejs.org/en/about/previous-releases |
| nvm (gestion versions) | https://github.com/nvm-sh/nvm |
| corepack (pnpm) | https://nodejs.org/api/corepack.html |

### TypeScript
| Ressource | Lien |
|-----------|------|
| Handbook | https://www.typescriptlang.org/docs/handbook/intro.html |
| tsconfig reference | https://www.typescriptlang.org/tsconfig |
| Strict mode | https://www.typescriptlang.org/tsconfig#strict |
| Release notes | https://devblogs.microsoft.com/typescript/ |

---

## Backend — `apps/api`

### NestJS
| Ressource | Lien |
|-----------|------|
| **Documentation principale** | https://docs.nestjs.com/ |
| First steps | https://docs.nestjs.com/first-steps |
| Modules | https://docs.nestjs.com/modules |
| Controllers | https://docs.nestjs.com/controllers |
| Providers & DI | https://docs.nestjs.com/providers |
| Guards | https://docs.nestjs.com/guards |
| Interceptors | https://docs.nestjs.com/interceptors |
| Exception filters | https://docs.nestjs.com/exception-filters |
| Validation | https://docs.nestjs.com/techniques/validation |
| Configuration | https://docs.nestjs.com/techniques/configuration |
| Database (Prisma) | https://docs.nestjs.com/recipes/prisma |
| Testing | https://docs.nestjs.com/fundamentals/testing |
| OpenAPI / Swagger | https://docs.nestjs.com/openapi/introduction |
| Security | https://docs.nestjs.com/security/authentication |
| GitHub | https://github.com/nestjs/nest |
| Guide projet | [guide-api-backend](../guides/guide-api-backend.md) |

### Prisma ORM
| Ressource | Lien |
|-----------|------|
| **Documentation** | https://www.prisma.io/docs |
| Getting started | https://www.prisma.io/docs/getting-started |
| Schema reference | https://www.prisma.io/docs/orm/reference/prisma-schema-reference |
| Migrate | https://www.prisma.io/docs/orm/prisma-migrate |
| Client API | https://www.prisma.io/docs/orm/prisma-client |
| PostgreSQL | https://www.prisma.io/docs/orm/overview/databases/postgresql |
| Raw queries | https://www.prisma.io/docs/orm/prisma-client/using-raw-sql |
| Seed | https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding |
| Guide projet | [schema-base-de-donnees.md](../schema-base-de-donnees.md) |

### Zod (validation)
| Ressource | Lien |
|-----------|------|
| Documentation | https://zod.dev/ |
| Basic usage | https://zod.dev/?id=basic-usage |
| infer types | https://zod.dev/?id=type-inference |
| nestjs-zod | https://github.com/risenforces/nestjs-zod |

### BullMQ (queues)
| Ressource | Lien |
|-----------|------|
| **Documentation** | https://docs.bullmq.io/ |
| Quick start | https://docs.bullmq.io/readme-1 |
| NestJS guide | https://docs.bullmq.io/guide/nestjs |
| Workers | https://docs.bullmq.io/guide/workers |
| Retry | https://docs.bullmq.io/guide/retrying-failing-jobs |
| GitHub | https://github.com/taskforcesh/bullmq |

### Pino (logs)
| Ressource | Lien |
|-----------|------|
| Documentation | https://getpino.io/ |
| API | https://getpino.io/#/docs/api |
| NestJS pino | https://github.com/iamolegga/nestjs-pino |

### Stripe (backend)
| Ressource | Lien |
|-----------|------|
| **Stripe Docs** | https://docs.stripe.com/ |
| Connect overview | https://docs.stripe.com/connect |
| Express accounts | https://docs.stripe.com/connect/express-accounts |
| PaymentIntents | https://docs.stripe.com/payments/payment-intents |
| Manual capture | https://docs.stripe.com/payments/place-a-hold-on-a-payment-method |
| Webhooks | https://docs.stripe.com/webhooks |
| Connect charges | https://docs.stripe.com/connect/charges |
| Testing | https://docs.stripe.com/testing |
| CLI (local webhooks) | https://docs.stripe.com/stripe-cli |
| Node SDK | https://github.com/stripe/stripe-node |
| API reference | https://docs.stripe.com/api |
| Guide projet | [guide-integrations](../guides/guide-integrations.md) |

---

## Base de données

### PostgreSQL
| Ressource | Lien |
|-----------|------|
| **Docs v16** | https://www.postgresql.org/docs/16/ |
| Tutorial | https://www.postgresql.org/docs/16/tutorial.html |
| Data types | https://www.postgresql.org/docs/16/datatype.html |
| JSON functions | https://www.postgresql.org/docs/16/functions-json.html |
| Index | https://www.postgresql.org/docs/16/indexes.html |

### PostGIS (géolocalisation)
| Ressource | Lien |
|-----------|------|
| **Documentation** | https://postgis.net/documentation/ |
| ST_Contains | https://postgis.net/docs/ST_Contains.html |
| ST_DWithin (distance) | https://postgis.net/docs/ST_DWithin.html |
| Geography vs Geometry | https://postgis.net/workshops/postgis-intro/geography.html |
| Docker image | https://hub.docker.com/r/postgis/postgis |

### Redis
| Ressource | Lien |
|-----------|------|
| Documentation | https://redis.io/docs/ |
| Commands | https://redis.io/commands/ |
| Node client (ioredis) | https://github.com/redis/ioredis |
| Docker | https://hub.docker.com/_/redis |

---

## Mobile — `apps/mobile-client` & `apps/mobile-provider`

### Expo
| Ressource | Lien |
|-----------|------|
| **Documentation** | https://docs.expo.dev/ |
| Create a project | https://docs.expo.dev/get-started/create-a-project/ |
| Environment variables | https://docs.expo.dev/guides/environment-variables/ |
| app.config.js | https://docs.expo.dev/workflow/configuration/ |
| EAS Overview | https://docs.expo.dev/eas/ |
| SDK 52 reference | https://docs.expo.dev/versions/latest/ |
| Guide projet client | [guide-mobile-client](../guides/guide-mobile-client.md) |
| Guide projet pro | [guide-mobile-pro](../guides/guide-mobile-pro.md) |

### Expo Router (navigation)
| Ressource | Lien |
|-----------|------|
| Introduction | https://docs.expo.dev/router/introduction/ |
| File-based routing | https://docs.expo.dev/router/create-pages/ |
| Layouts | https://docs.expo.dev/router/layouts/ |
| Deep linking | https://docs.expo.dev/router/reference/url-parameters/ |

### React Native
| Ressource | Lien |
|-----------|------|
| **Documentation** | https://reactnative.dev/docs/getting-started |
| Components | https://reactnative.dev/docs/components-and-apis |
| Style | https://reactnative.dev/docs/style |
| Debugging | https://reactnative.dev/docs/debugging |
| Environment setup | https://reactnative.dev/docs/environment-setup |

### React
| Ressource | Lien |
|-----------|------|
| Learn React | https://react.dev/learn |
| Hooks | https://react.dev/reference/react |
| TypeScript | https://react.dev/learn/typescript |

### TanStack Query (React Query)
| Ressource | Lien |
|-----------|------|
| Overview | https://tanstack.com/query/latest/docs/framework/react/overview |
| Quick start | https://tanstack.com/query/latest/docs/framework/react/quick-start |
| useQuery | https://tanstack.com/query/latest/docs/framework/react/reference/useQuery |
| useMutation | https://tanstack.com/query/latest/docs/framework/react/reference/useMutation |
| Query keys | https://tanstack.com/query/latest/docs/framework/react/guides/query-keys |

### Zustand (state local)
| Ressource | Lien |
|-----------|------|
| Documentation | https://docs.pmnd.rs/zustand/getting-started/introduction |
| TypeScript | https://docs.pmnd.rs/zustand/guides/typescript |
| Persist | https://docs.pmnd.rs/zustand/integrations/persisting-store-data |

### React Hook Form
| Ressource | Lien |
|-----------|------|
| Get started | https://react-hook-form.com/get-started |
| useForm | https://react-hook-form.com/docs/useform |
| Zod resolver | https://github.com/react-hook-form/resolvers#zod |

### NativeWind (Tailwind RN)
| Ressource | Lien |
|-----------|------|
| Documentation | https://www.nativewind.dev/ |
| Getting started RN | https://www.nativewind.dev/docs/getting-started/react-native |
| v4 setup | https://www.nativewind.dev/v4/overview |

### Stripe React Native
| Ressource | Lien |
|-----------|------|
| Accept a payment | https://docs.stripe.com/payments/accept-a-payment?platform=react-native |
| PaymentSheet | https://docs.stripe.com/payments/accept-a-payment?platform=react-native&ui=payment-sheet |
| GitHub SDK | https://github.com/stripe/stripe-react-native |
| Expo plugin | https://docs.stripe.com/payments/accept-a-payment?platform=react-native#setup |

### react-native-maps
| Ressource | Lien |
|-----------|------|
| GitHub & README | https://github.com/react-native-maps/react-native-maps |
| Expo MapView | https://docs.expo.dev/versions/latest/sdk/map-view/ |

### Expo — modules natifs utilisés
| Module | Lien |
|--------|------|
| Notifications (push) | https://docs.expo.dev/push-notifications/overview/ |
| SecureStore (JWT) | https://docs.expo.dev/versions/latest/sdk/securestore/ |
| Image Picker (photos) | https://docs.expo.dev/versions/latest/sdk/imagepicker/ |
| Location (GPS) | https://docs.expo.dev/versions/latest/sdk/location/ |
| Image | https://docs.expo.dev/versions/latest/sdk/image/ |
| WebBrowser (Stripe Connect) | https://docs.expo.dev/versions/latest/sdk/webbrowser/ |

### EAS (builds & deploy mobile)
| Ressource | Lien |
|-----------|------|
| EAS Build | https://docs.expo.dev/build/introduction/ |
| eas.json | https://docs.expo.dev/build/eas-json/ |
| EAS Submit (stores) | https://docs.expo.dev/submit/introduction/ |
| EAS Update (OTA) | https://docs.expo.dev/eas-update/introduction/ |
| CLI install | https://docs.expo.dev/build/setup/ |

---

## Admin — `apps/admin`

### Next.js 15
| Ressource | Lien |
|-----------|------|
| **Documentation** | https://nextjs.org/docs |
| App Router | https://nextjs.org/docs/app |
| Routing | https://nextjs.org/docs/app/building-your-application/routing |
| Server Components | https://nextjs.org/docs/app/building-your-application/rendering/server-components |
| Client Components | https://nextjs.org/docs/app/building-your-application/rendering/client-components |
| Middleware | https://nextjs.org/docs/app/building-your-application/routing/middleware |
| Environment variables | https://nextjs.org/docs/app/building-your-application/configuring/environment-variables |
| Guide projet | [guide-admin](../guides/guide-admin.md) |

### shadcn/ui
| Ressource | Lien |
|-----------|------|
| Documentation | https://ui.shadcn.com/docs |
| Installation Next.js | https://ui.shadcn.com/docs/installation/next |
| Components | https://ui.shadcn.com/docs/components |
| Data Table | https://ui.shadcn.com/docs/components/data-table |

### TanStack Table
| Ressource | Lien |
|-----------|------|
| Introduction | https://tanstack.com/table/latest/docs/introduction |
| React guide | https://tanstack.com/table/latest/docs/framework/react/guide |
| Pagination | https://tanstack.com/table/latest/docs/guide/pagination |

### Tailwind CSS
| Ressource | Lien |
|-----------|------|
| Documentation | https://tailwindcss.com/docs |
| Installation | https://tailwindcss.com/docs/installation |
| Theme config | https://tailwindcss.com/docs/theme |
| v4 docs | https://tailwindcss.com/docs/v4-beta |

### Radix UI (base shadcn)
| Ressource | Lien |
|-----------|------|
| Documentation | https://www.radix-ui.com/primitives/docs/overview/introduction |

---

## Packages partagés

### `@carservice/shared-types` (Zod schemas)
| Ressource | Lien |
|-----------|------|
| Zod | https://zod.dev/ |
| Guide projet | [guide-packages-partages](../guides/guide-packages-partages.md) |

### `@carservice/api-client`
| Ressource | Lien |
|-----------|------|
| fetch API (MDN) | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API |
| Guide projet | [api-contrat-v1.md](../api-contrat-v1.md) |

### `@carservice/ui-tokens`
| Ressource | Lien |
|-----------|------|
| Design tokens spec | [spec-figma.md](../spec-figma.md) |

---

## Infrastructure & DevOps

### Docker
| Ressource | Lien |
|-----------|------|
| Documentation | https://docs.docker.com/ |
| Compose | https://docs.docker.com/compose/ |
| Compose file reference | https://docs.docker.com/reference/compose-file/ |
| Docker Desktop Mac | https://docs.docker.com/desktop/setup/install/mac-install/ |
| Guide projet | [guide-infra-devops](../guides/guide-infra-devops.md) |

### GitHub Actions (CI/CD)
| Ressource | Lien |
|-----------|------|
| Documentation | https://docs.github.com/en/actions |
| Workflow syntax | https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions |
| Node.js CI | https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs |

### Railway (hosting API)
| Ressource | Lien |
|-----------|------|
| Documentation | https://docs.railway.com/ |
| Deploy Node | https://docs.railway.com/guides/nodejs |
| PostgreSQL | https://docs.railway.com/guides/postgresql |
| Redis | https://docs.railway.com/guides/redis |

### Render (alternative hosting)
| Ressource | Lien |
|-----------|------|
| Documentation | https://render.com/docs |
| Node web service | https://render.com/docs/web-services |
| PostgreSQL | https://render.com/docs/databases |

### Vercel (admin Next.js)
| Ressource | Lien |
|-----------|------|
| Documentation | https://vercel.com/docs |
| Next.js on Vercel | https://vercel.com/docs/frameworks/nextjs |

### Scaleway Object Storage (S3-compatible)
| Ressource | Lien |
|-----------|------|
| Documentation | https://www.scaleway.com/en/docs/storage/object/ |
| API S3 | https://www.scaleway.com/en/docs/storage/object/api-cli/ |
| AWS SDK v3 (compatible) | https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/ |

### Cloudflare R2 (alternative storage)
| Ressource | Lien |
|-----------|------|
| Documentation | https://developers.cloudflare.com/r2/ |
| S3 API compatibility | https://developers.cloudflare.com/r2/api/s3/api/ |

---

## Intégrations & services externes

### Google Maps Platform
| Ressource | Lien |
|-----------|------|
| **Documentation** | https://developers.google.com/maps/documentation |
| Places API (autocomplete) | https://developers.google.com/maps/documentation/places/web-service/overview |
| Geocoding API | https://developers.google.com/maps/documentation/geocoding/overview |
| Maps SDK iOS | https://developers.google.com/maps/documentation/ios-sdk/overview |
| Maps SDK Android | https://developers.google.com/maps/documentation/android-sdk/overview |
| Pricing | https://developers.google.com/maps/billing-and-pricing/pricing |
| Session tokens (coût) | https://developers.google.com/maps/documentation/places/web-service/session-tokens |

### Twilio (SMS OTP)
| Ressource | Lien |
|-----------|------|
| Documentation | https://www.twilio.com/docs |
| SMS API | https://www.twilio.com/docs/messaging/api |
| Verify API | https://www.twilio.com/docs/verify/api |
| Node SDK | https://www.twilio.com/docs/libraries/node |

### Brevo (email + SMS)
| Ressource | Lien |
|-----------|------|
| Developer docs | https://developers.brevo.com/ |
| Send transactional email | https://developers.brevo.com/reference/sendtransacemail |
| SMS API | https://developers.brevo.com/reference/sendtransacsms |

### Resend (email alternative)
| Ressource | Lien |
|-----------|------|
| Documentation | https://resend.com/docs |
| Node SDK | https://resend.com/docs/send-with-nodejs |

### PostHog (analytics)
| Ressource | Lien |
|-----------|------|
| Documentation | https://posthog.com/docs |
| React Native | https://posthog.com/docs/libraries/react-native |
| Next.js | https://posthog.com/docs/libraries/next-js |

---

## Observabilité

### Sentry
| Ressource | Lien |
|-----------|------|
| Documentation | https://docs.sentry.io/ |
| NestJS | https://docs.sentry.io/platforms/javascript/guides/nestjs/ |
| React Native | https://docs.sentry.io/platforms/react-native/ |
| Next.js | https://docs.sentry.io/platforms/javascript/guides/nextjs/ |
| Performance | https://docs.sentry.io/product/performance/ |

---

## Tests

### Jest
| Ressource | Lien |
|-----------|------|
| Documentation | https://jestjs.io/docs/getting-started |
| Expect API | https://jestjs.io/docs/expect |
| NestJS testing | https://docs.nestjs.com/fundamentals/testing |

### Supertest (API HTTP)
| Ressource | Lien |
|-----------|------|
| GitHub | https://github.com/ladjs/supertest |

### React Native Testing Library
| Ressource | Lien |
|-----------|------|
| Documentation | https://callstack.github.io/react-native-testing-library/ |

### Maestro (E2E mobile — phase 2)
| Ressource | Lien |
|-----------|------|
| Documentation | https://maestro.mobile.dev/ |

### Stripe CLI (test webhooks)
| Ressource | Lien |
|-----------|------|
| Install & usage | https://docs.stripe.com/stripe-cli |

---

## Environnement dev Mac

| Outil | Documentation |
|-------|---------------|
| **nvm** | https://github.com/nvm-sh/nvm |
| **corepack** | https://nodejs.org/api/corepack.html |
| **Xcode** | https://developer.apple.com/xcode/ |
| **Watchman** | https://facebook.github.io/watchman/docs/install |
| **CocoaPods** | https://guides.cocoapods.org/ |
| **Homebrew** | https://docs.brew.sh/ |
| **Android Studio** | https://developer.android.com/studio/intro |
| Matrice versions CARSERVICE | [versions.md](versions.md) |
| Script vérification | `../../tools/check-env.sh` |
| Setup auto | `../../tools/setup-dev.sh` |

---

## Documentation projet (interne)

| Sujet | Lien |
|-------|------|
| Index documentation | [docs/README.md](../README.md) |
| Standards de code | [standards-developpement.md](../standards-developpement.md) |
| Contrat API v1 | [api-contrat-v1.md](../api-contrat-v1.md) |
| Règles métier (RG) | [regles-de-gestion.md](../regles-de-gestion.md) |
| Schéma BDD | [schema-base-de-donnees.md](../schema-base-de-donnees.md) |
| Architecture | [etude-architecture-technique.md](../etude-architecture-technique.md) |
| Backlog Jira | [backlog-jira.md](../backlog-jira.md) |
| Wireframes | [wireframes.md](../wireframes.md) |
| Spec Figma | [spec-figma.md](../spec-figma.md) |
| Skill IA Cursor | [.cursor/skills/carservice-dev/SKILL.md](../../.cursor/skills/carservice-dev/SKILL.md) |
| Résolution bugs | [.cursor/skills/carservice-dev/bug-resolution.md](../../.cursor/skills/carservice-dev/bug-resolution.md) |

---

## Comment l’agent IA doit utiliser ce fichier

1. Avant d’implémenter une feature → ouvrir la section techno concernée  
2. Vérifier la version dans [versions.md](versions.md)  
3. Croiser avec le guide couche (`docs/guides/`)  
4. Respecter [regles-de-gestion.md](../regles-de-gestion.md) pour la logique métier
