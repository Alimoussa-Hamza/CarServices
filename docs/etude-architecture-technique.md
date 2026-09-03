# Étude d’architecture technique — CARSERVICE

> **Version :** 1.0  
> **Date :** 26 août 2026  
> **Objectif :** choisir la stack et le style d’architecture adaptés au MVP lavage à domicile, évolutif multi-services.

---

## 1. Contexte & contraintes

### 1.1 Produit
Marketplace France : clients ↔ pros, **lavage à domicile** (MVP), puis d’autres catégories (`battery`, etc.).

### 1.2 Besoins techniques dérivés du métier

| Besoin métier | Implication technique |
|---------------|----------------------|
| Matching géolocalisé | PostGIS / geo queries, zones polygones |
| Paiement marketplace | Stripe Connect (pre-auth, capture, split) |
| Temps réel léger | Push + WebSocket optionnel (statut mission) |
| Photos avant/après | Object storage (S3-compatible) |
| KYC docs | Upload sécurisé + rétention RGPD |
| Admin catalogue / litiges | Back-office web |
| Multi-apps (Client / Pro / Admin) | API unique + 2 apps mobiles (+ web admin) |
| Évolutivité catalogue | Monolithe modulaire, feature flags |
| 1 ville puis scale | Architecture simple d’abord, pas de microservices |

### 1.3 Contraintes projet (hypothèses)

| Critère | Hypothèse |
|---------|-----------|
| Équipe | 1–3 développeurs (solo / petite équipe) |
| Time-to-market MVP | 3–5 mois |
| Budget infra Y1 | Faible à moyen (< 300 €/mois début) |
| Langages | Préférence TypeScript si stack unifiée |
| Conformité | RGPD, France, Stripe EU |

---

## 2. Styles d’architecture comparés

### 2.1 Options

| Style | Description | Adapté CARSERVICE ? |
|-------|-------------|---------------------|
| **A. Monolithe modulaire** | Une API, modules métier (users, catalog, bookings, payments…) | **Oui — recommandé MVP** |
| **B. Microservices** | Services séparés (booking, pay, notify…) | Non — trop tôt (ops, latence, coût) |
| **C. BaaS only** (Firebase/Supabase) | Backend managé + règles | Partiel — OK prototype, fragile pour Connect + matching complexe |
| **D. Serverless** (Lambda + API GW) | Fonctions à la demande | Possible plus tard ; complexité marketplace + états booking |

### 2.2 Recommandation architecture

```
┌─────────────┐  ┌─────────────┐  ┌──────────────┐
│ App Client  │  │  App Pro    │  │ Admin Web    │
│ (mobile)    │  │  (mobile)   │  │ (Next.js)    │
└──────┬──────┘  └──────┬──────┘  └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │ HTTPS / REST (+ WS optionnel)
                        ▼
              ┌─────────────────────┐
              │   API Gateway /     │
              │   Monolithe API     │
              │   (NestJS)          │
              └─────────┬───────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   PostgreSQL(+PostGIS) Redis        Queue (Bull)
        │               │               │
        │               │               ▼
        │               │         Workers (emails,
        │               │         matching, webhooks)
        ▼               ▼
   S3 photos      Stripe / FCM / Maps
```

**Principe :** *Modular monolith* — un déploiement, frontières claires par module, extraction future possible (payments, matching) si charge réelle.

### 2.3 Modules API (bornes)

```
auth / users
catalog          ← categories, offers, options, zones, pricing
providers        ← KYC, capabilities, availability
bookings         ← state machine, matching orchestration
payments         ← Stripe Connect, webhooks
reviews / disputes
notifications
admin / config   ← feature flags, commission, timers
media            ← upload signed URLs
```

---

## 3. Critères de décision (pondération)

| Critère | Poids | Description |
|---------|-------|-------------|
| Time-to-market | 25 % | Vitesse MVP |
| Fit marketplace | 20 % | Paiements split, géo, state machine |
| Talent / équipe FR | 15 % | Facilité recrutement / freelances |
| Coût long terme | 15 % | Infra + maintenance |
| UX mobile | 15 % | Qualité apps Client + Pro |
| Évolutivité | 10 % | Multi-services, multi-villes |

---

## 4. Mobile (Client + Pro)

### 4.1 Options

| Techno | Avantages | Inconvénients |
|--------|-----------|---------------|
| **React Native (Expo)** | JS/TS, 1 codebase, Expo OTA, écosystème maps/Stripe, partage types avec Nest | Perf UI custom un peu moins “pixel-perfect” que Flutter |
| **Flutter** | UI très soignée, perf, 1 codebase | Dart (autre langage), moins de partage code avec API TS |
| **Native** (Swift + Kotlin) | Meilleure intégration OS | 2× coût, hors budget MVP |
| **PWA** | Pas de store | Push/géoloc/caméra plus fragiles ; pros moins engagés |

### 4.2 Comparatif React Native vs Flutter (CARSERVICE)

| Critère | React Native + Expo | Flutter | Gagnant |
|---------|---------------------|---------|---------|
| Alignement stack TS | Excellent | Faible | RN |
| Maps + Stripe SDK | Mature | Mature | Égal |
| Caméra / photos | Mature | Mature | Égal |
| Push notifications | Expo Notifications / FCM | FCM | Égal |
| Recrutement FR | Très bon | Bon | RN |
| Design system Figma → code | Bon (RN Paper / NativeWind) | Excellent widgets | Flutter |
| Time-to-market MVP | Très bon avec Expo | Bon | RN |
| Apps Client + Pro | 1 monorepo, 2 targets / flavors | Idem | Égal |

### 4.3 Recommandation mobile

**React Native + Expo (managed / prebuild)** — stack TypeScript unifiée avec le backend.

| Décision | Choix | Pourquoi |
|----------|-------|----------|
| Framework | Expo SDK 52+ | Builds EAS, OTA, config native sans douleur |
| Navigation | Expo Router | Routes claires, deep links |
| UI | NativeWind ou Tamagui + composants custom | Alignement design tokens Figma |
| State | TanStack Query + Zustand | Cache API + état UI léger |
| Forms | React Hook Form + Zod | Validation partagée avec API |
| Maps | `react-native-maps` + Google Maps (FR) | Autocomplete Places |
| Paiement | `@stripe/stripe-react-native` | PaymentSheet + Connect |

**Structure apps :**

```
apps/
  mobile-client/     # flavor client
  mobile-provider/   # flavor pro
  # OU un seul app avec role switch (moins clair stores)
packages/
  shared/            # types Zod, API client, UI kit
```

**Recommandation produit stores :** 2 apps distinctes (`CARSERVICE` + `CARSERVICE Pro`) — meilleure clarté App Store / Play, permissions et onboarding différents.

**Alternative valide :** Flutter si le designer exige un rendu pixel-perfect très custom et que l’équipe connaît déjà Dart.

---

## 5. Backend API

### 5.1 Options

| Techno | Avantages | Inconvénients |
|--------|-----------|---------------|
| **NestJS** (Node/TS) | Modulaire, DI, typé, WebSockets, queues Bull, excellent pour state machines | Moins “batteries-included” que Laravel |
| **Laravel** (PHP) | Très rapide MVP, Filament admin, Cashier, écosystème mature | Stack split si mobile TS ; PHP ≠ mobile |
| **Django** | Admin intégré, solide | Moins courant freelance mobile-first FR |
| **Supabase** | Auth + DB + storage rapide | Logique métier marketplace limitée ; vendor lock |

### 5.2 NestJS vs Laravel pour CARSERVICE

| Critère | NestJS | Laravel | Score CARSERVICE |
|---------|--------|---------|------------------|
| Time-to-market solo | Bon | Excellent | Laravel +0.5 |
| Admin panel | À construire (ou AdminJS / Next) | Filament excellent | Laravel +1 |
| Temps réel / jobs matching | Excellent (Bull + WS) | Bon (Horizon/Reverb) | Nest +0.5 |
| Stack unifiée TS + mobile | Excellent | Faible | Nest +2 |
| Marketplace Stripe Connect | SDK Stripe officiel | Cashier + custom Connect | Nest +0.5 |
| Modularité long terme | Excellent | Bon | Nest +0.5 |
| Recrutement | Très bon | Excellent | Égal |

### 5.3 Recommandation backend

**NestJS + TypeScript** si équipe JS/TS (cas le plus probable avec RN).

| Couche | Choix | Pourquoi |
|--------|-------|----------|
| Framework | NestJS 11 | Modules = domaines métier |
| ORM | Prisma | Schéma lisible, migrations, typage |
| Validation | Zod ou class-validator | Aligné mobile |
| Auth | JWT + refresh ; OTP SMS (Twilio / Vonage) | MVP téléphone |
| Queue | BullMQ + Redis | Matching timeout, emails, webhooks Stripe |
| Docs API | OpenAPI (Swagger Nest) | Contrat mobile/admin |
| Tests | Jest + Supertest | State machine booking critique |

**Alternative forte :** **Laravel + Filament** si 1 backend PHP solo et admin prioritaire — tout à fait viable ; le mobile RN consomme l’API JSON de la même façon.

### 5.4 Pourquoi pas microservices au MVP

- Latence matching + paiement + notifs = orchestration simple dans 1 process
- Debugging litiges / webhooks Stripe plus simple
- Coût ops ×3–5 évité
- Extraction possible plus tard : `payments-service`, `matching-worker`

---

## 6. Base de données & stockage

### 6.1 Base principale

| Option | Verdict |
|--------|---------|
| **PostgreSQL + PostGIS** | **Recommandé** — ACID, JSONB (snapshots), polygones zones, geo distance |
| MySQL | Possible mais PostGIS = avantage PG |
| MongoDB | Mauvaise idée pour paiements / bookings transactionnels |

### 6.2 Cache & sessions

| Techno | Usage |
|--------|-------|
| **Redis** | Cache slots, rate limit OTP, BullMQ, sessions optionnelles |

### 6.3 Fichiers

| Techno | Usage |
|--------|-------|
| **S3** (AWS) ou **Cloudflare R2** / **Scaleway Object Storage** | Photos KYC, avant/après |
| Signed URLs | Upload direct mobile → storage (API ne proxy pas les binaires) |

**Préférence FR/EU :** Scaleway Object Storage ou R2 (coût + RGPD).

### 6.4 Recherche (phase 2)

Postgres full-text suffit MVP. Meilisearch / Typesense si catalogue gros plus tard.

---

## 7. Paiements

### 7.1 Options marketplace

| Solution | Verdict |
|----------|---------|
| **Stripe Connect** | **Standard industrie** — Express accounts, Destination charges / Separate charges & transfers |
| Mangopay | Fort en marketplaces EU, KYC intégré, plus lourd |
| PayPal Commerce | Moins adapté UX FR mobile premium |
| Lemonway | Regulated EU, plus “fintech lourde” |

### 7.2 Recommandation

**Stripe Connect Express** + compte plateforme FR.

| Flux | Implémentation |
|------|----------------|
| Réservation | `PaymentIntent` + **manual capture** (pre-auth) |
| Clôture | Capture + transfer / application_fee |
| Annulation | Cancel PI / refund selon RG-CANCEL |
| Pro onboarding | Stripe Account Links (Express) |
| Webhooks | Endpoint dédié + idempotency keys |

**Ne pas** reinventer un wallet interne au MVP.

---

## 8. Cartes, SMS, Push, Email

| Besoin | Option A | Option B | Choix MVP |
|--------|----------|----------|-----------|
| Cartes / géocoding | Google Maps Platform | Mapbox | **Google** (Places FR excellent) ou Mapbox si budget |
| SMS OTP | Twilio | Vonage / MessageBird | **Twilio** ou **Brevo SMS** |
| Push | FCM + APNs via Expo | OneSignal | **Expo Notifications** |
| Email | Resend / Brevo | SES | **Brevo** (FR) ou Resend |
| Analytics | PostHog | Mixpanel | **PostHog** (self-host ou cloud) |

**Coût maps :** Places Autocomplete = poste de coût à surveiller ; cacher résultats, limiter appels.

---

## 9. Admin web

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **Next.js + shadcn/ui** | Cohérent TS, UI moderne, SSR | À développer |
| AdminJS / React-Admin | Rapide sur Prisma/Nest | Moins beau / custom |
| Filament (si Laravel) | Très rapide | Couplé PHP |

**Recommandation :** **Next.js 15 (App Router) + shadcn/ui** consommant la même API Nest — écrans A01–A09 du CDC.

---

## 10. Hébergement & DevOps

### 10.1 Options

| Couche | Option recommandée | Alternatives |
|--------|-------------------|--------------|
| API + workers | **Railway** / **Render** / **Fly.io** | Scaleway CAPSULE, AWS ECS |
| PostgreSQL | Managed (Railway/Render/Scaleway) | Neon, Supabase DB only |
| Redis | Upstash ou managed | Redis Cloud |
| Storage | Scaleway / R2 | S3 |
| CI/CD | GitHub Actions | GitLab CI |
| Mobile builds | **EAS Build** (Expo) | Codemagic (Flutter) |
| Monitoring | Sentry + Axiom/Logtail | Datadog (cher) |
| Secrets | Doppler / env CI | 1Password |

### 10.2 Environnements

```
local → staging → production
```

- Staging : Stripe test mode, maps quotas bas
- Prod : backups PG quotidiens, retention photos 24 mois (RG-QUAL)

### 10.3 Estimation coûts infra (ordre de grandeur)

| Phase | Mensuel approx. |
|-------|-----------------|
| MVP (faible trafic, 1 ville) | 50–150 € |
| Traction (quelques milliers bookings/mois) | 200–500 € |
| Multi-villes | 500–1500 € + maps/SMS |

Hors : Apple Developer 99 $/an, Google Play 25 $, Stripe fees (~1.5%+), SMS OTP.

---

## 11. Sécurité & conformité (architecture)

| Sujet | Mesure |
|-------|--------|
| Auth | OTP rate-limited, JWT short-lived + refresh |
| Rôles | Guards Nest (`client` / `provider` / `admin`) |
| Paiements | Jamais stocker PAN ; Stripe Elements / PaymentSheet |
| Docs KYC | Bucket privé, URLs signées TTL courte, audit log admin |
| RGPD | Consent géoloc, export/anonymisation compte, DPA sous-traitants EU |
| Secrets | Pas de clés dans le repo |
| Webhooks | Signature Stripe vérifiée |
| Photos | Pas d’indexation publique |

---

## 12. Stack recommandée (synthèse)

### 12.1 Stack cible MVP — **recommandée**

| Couche | Techno |
|--------|--------|
| Mobile Client + Pro | **React Native + Expo** |
| Admin | **Next.js + shadcn/ui** |
| API | **NestJS** |
| ORM | **Prisma** |
| DB | **PostgreSQL + PostGIS** |
| Cache / Queue | **Redis + BullMQ** |
| Paiement | **Stripe Connect Express** |
| Storage | **Scaleway Object Storage** ou **R2** |
| Maps | **Google Maps Platform** |
| SMS | **Twilio** ou **Brevo** |
| Push | **Expo Notifications** |
| Email | **Brevo** / **Resend** |
| Hosting | **Railway** ou **Render** (+ Neon optionnel) |
| Observabilité | **Sentry** + logs |
| Monorepo | **pnpm + Turborepo** |

### 12.2 Schéma monorepo

```
carservice/
├── apps/
│   ├── api/                 # NestJS
│   ├── admin/               # Next.js
│   ├── mobile-client/       # Expo
│   └── mobile-provider/     # Expo
├── packages/
│   ├── shared-types/        # Zod schemas, DTO
│   ├── api-client/          # fetch/axios typé
│   └── ui-tokens/           # couleurs/spacing Figma
├── docs/                    # déjà existant
└── turbo.json
```

### 12.3 Stack alternative “ship ultra-rapide”

Si priorité absolue = admin + backend en 6 semaines avec 1 dev PHP :

| Couche | Techno |
|--------|--------|
| API + Admin | **Laravel 12 + Filament** |
| Mobile | React Native + Expo (inchangé) |
| DB | PostgreSQL |
| Paiement | Stripe Connect |
| Queue | Laravel Horizon + Redis |

Viable et cohérente ; moins d’unification TS.

---

## 13. Décisions “non négociables” MVP

1. **API unique** pour Client, Pro, Admin  
2. **PostgreSQL** (pas Mongo)  
3. **Stripe Connect** (pas wallet maison)  
4. **Monolithe modulaire** (pas microservices)  
5. **State machine booking** côté serveur uniquement  
6. **Feature flags** catégories (`wash` only)  
7. **Signed uploads** pour photos  

---

## 14. Roadmap technique

| Phase | Durée | Livrables tech |
|-------|-------|----------------|
| **T0** | 1–2 sem. | Monorepo, CI, Nest hello, PG+PostGIS, Prisma schema v1 |
| **T1** | 3–4 sem. | Auth OTP, catalog, zones, providers KYC basique |
| **T2** | 4–5 sem. | Bookings + matching + Stripe pre-auth/capture |
| **T3** | 3–4 sem. | Apps Expo Client + Pro (parcours C03–C10 / P02–P05) |
| **T4** | 2–3 sem. | Admin Next, litiges, notifications, staging |
| **T5** | 2 sem. | Soft launch 1 ville, monitoring, runbooks |

**Total indicatif :** ~4–5 mois à 1–2 devs full-time.

---

## 15. Risques techniques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Coût Google Places | Budget | Cache, session tokens, limiter frappes |
| Matching froid (peu de pros) | UX | Broadcast large + SLA remboursement (déjà RG) |
| Webhooks Stripe manqués | Argent | Idempotency + retry + reconcil job |
| Rejection App Store | Délai | Comptes demo, privacy labels, KYC clair |
| Dette monolithe | Scale | Modules stricts, boundaries, métriques avant split |
| Double app Client/Pro | Maintenance | Package `shared` maximal |

---

## 16. Matrice de décision finale

| Question | Réponse |
|----------|---------|
| Architecture globale ? | **Monolithe modulaire** |
| Mobile ? | **React Native + Expo** |
| Backend ? | **NestJS + Prisma** |
| DB ? | **PostgreSQL + PostGIS** |
| Paiement ? | **Stripe Connect Express** |
| Admin ? | **Next.js** |
| Hébergement démarrage ? | **Railway/Render + S3-compatible EU** |
| Quand microservices ? | Après preuve de charge / équipe ≥ 5 |

---

## 17. Prochaines étapes concrètes

1. Valider stack recommandée (ou alternative Laravel)  
2. Initialiser monorepo Turborepo + Nest + Prisma (schéma déjà documenté)  
3. Brancher Stripe Connect test + webhook staging  
4. Scaffold Expo Client/Pro avec design tokens  

---

## Références internes

- [Index docs officielles (toutes technos)](tech-stack/README.md)
- [Standards de développement](standards-developpement.md)
- [Cahier des charges](cahier-des-charges.md)
- [Règles de gestion](regles-de-gestion.md)
- [Schéma base de données](schema-base-de-donnees.md)
- [Wireframes](wireframes.md)
- [Spec Figma](spec-figma.md)
