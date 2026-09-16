# Cahier de tâches — Mobile Client CarWash · Module M11

> **Marque UI :** CarWash · **Repo :** CARSERVICE  
> **Maquettes :** [docs/ux/maquettes-client-carwash.pdf](ux/maquettes-client-carwash.pdf) (PDF UX Pilot v2)  
> **Bonnes pratiques UI :** [cahier-bonnes-pratiques-ui.md](cahier-bonnes-pratiques-ui.md) (tokens, nommage, composants, anti-dérive)  
> **API :** M02–M15 fermées · client via `@carservice/api-client`  
> **App :** `apps/mobile-client` (Expo 52, état actuel = splash API health)  
> **Suivi :** [backlog/suivi-taches.md](backlog/suivi-taches.md) piste N

---

## 1. Objectif & DoD module

Livrer l’app **client** iOS/Android alignée maquettes PDF : auth OTP → book → pay → suivi → avis → profil.

**Definition of Done M11**

- [ ] Stories CS-M11-S01 → S12 cochées (ou reportées avec justification)
- [ ] UI FR + tokens CarWash (`#0D6E4F`)
- [ ] Mode **mock** (sans API) + mode **API réelle** (toggle env)
- [ ] Tests unitaires composants/hooks critiques
- [ ] Tests intégration api-client sur flows client
- [ ] Gate e2e mobile **ou** parcours Detox/Maestro minimal **ou** checklist manuelle SC-01 signée + e2e API déjà verts
- [ ] `pnpm --filter @carservice/mobile-client typecheck` + build Expo OK
- [ ] Commit Conventional Commits + push

**Hors scope M11 :** app Pro (M12), Admin (M13), EAS store submit, Figma payant.

---

## 2. Cartographie écrans PDF → code

| PDF / ID | Écran | Route Expo (cible) | API principale |
|----------|--------|--------------------|----------------|
| Splash | Bootstrap | `/` | `GET /health` |
| C01 | Auth OTP | `/auth` | `POST /auth/otp/send\|verify` |
| C02 | Onboarding | `/onboarding` | `PATCH /clients/me` |
| C03 | Home | `/(tabs)/` | catalog + bookings list |
| C04 | Formules | `/book/catalog` | `GET /catalog/offers` |
| C05 | Config | `/book/config` | `POST /catalog/quote` |
| C06 | Adresse | `/book/address` | `POST /zones/check` + `/addresses` |
| — | Hors zone | `/book/out-of-zone` | `POST /zones/leads` |
| C07 | Créneau | `/book/slot` | `POST /bookings/slots` |
| C08 | Paiement | `/book/pay` | create booking + Stripe PaymentSheet |
| C09 | Confirmation | `/book/confirm` | booking detail |
| C10 | Suivi | `/bookings/[id]` | `GET /bookings/:id` |
| C11 | Avis | `/bookings/[id]/review` | `POST /reviews` |
| C12 | Réservations | `/(tabs)/bookings` | `GET /bookings` |
| C13 | Profil | `/(tabs)/profile` | `/clients/me`, addresses, delete |

---

## 3. Phases & tâches (checklist exécutable)

### Phase 0 — Environnement

| ID | Tâche | Critère de done |
|----|--------|-----------------|
| ENV-01 | `./tools/check-env.sh` vert (Node 20, pnpm 9) | Rapport OK | ✅ |
| ENV-02 | `pnpm db:up` + migrate + seed API | Health ready | (si API locale) |
| ENV-03 | `apps/mobile-client/.env` depuis `.env.example` | `EXPO_PUBLIC_API_URL` (simulator : `http://127.0.0.1:3000`, device : IP LAN) | ✅ |
| ENV-04 | Ajouter `EXPO_PUBLIC_USE_MOCKS=true\|false` | Documenté dans `.env.example` | ✅ |
| ENV-05 | `pnpm --filter @carservice/api dev` + `pnpm --filter @carservice/mobile-client dev` | App lance, health visible | à valider local |
| ENV-06 | Classer maquette : PDF déjà dans `docs/ux/maquettes-client-carwash.pdf` | Lien dans README mobile | ✅ |

### Phase 1 — Design system (tokens + composants)

| ID | Tâche | Critère de done | Statut |
|----|--------|-----------------|--------|
| DS-01 | Aligner `packages/ui-tokens` (brand CarWash, spacing, radius 12) | Export colors = maquette | ✅ |
| DS-02 | Typo mobile : display + body (pas Inter seul si possible via Expo fonts) | Tokens + chargement fonts | tokens ✅ · fonts Expo → S02+ |
| DS-03 | Composants UI de base : `Button`, `Input`, `OtpInput`, `Badge`, `Card`, `StickyCta`, `Tabs`, `EmptyState`, `ErrorBanner` | Story/tests smoke | Button + ErrorBanner ✅ |
| DS-04 | Theme RN (`ThemeProvider`) branché sur ui-tokens | 1 écran démo | ✅ Splash |
| DS-05 | Assets : logo mark (pas goutte d’eau), splash, icon | Dans `assets/` | pending |

### Phase 2 — Architecture app + mocks

| ID | Tâche | Critère de done | Statut |
|----|--------|-----------------|--------|
| ARCH-01 | Expo Router file-based (`app/`) + tabs layout | Remplace `App.tsx` monolith | ✅ |
| ARCH-02 | Auth store (SecureStore tokens) + `initApiClient({ getAccessToken })` | Persist session | ✅ |
| ARCH-03 | Couche `src/data/` : repositories (auth, catalog, booking, profile) | Interface unique | auth + health ✅ · reste → S03+ |
| ARCH-04 | **Mocks** JSON : offers, quote, slots, bookings, profile | Active si `EXPO_PUBLIC_USE_MOCKS=true` | offers/profile/bookings/otp ✅ |
| ARCH-05 | Booking wizard context (formule → config → adresse → slot → pay) | State machine simple | → S04 |
| ARCH-06 | Error mapping codes API → copy FR maquette | `Code incorrect.`, hors zone, etc. | OTP codes ✅ |

### Phase 3 — Développement écrans (stories M11)

| ID | Story | Tâches détaillées | Tests mini |
|----|--------|-------------------|------------|
| DEV-S01 | **CS-M11-S01** Setup Router + tokens | ARCH-01 + DS-* | typecheck |
| DEV-S02 | **CS-M11-S02** Auth C01 | send/verify OTP, CGU, navigation | unit OTP form + mock |
| DEV-S03 | Onboarding C02 | skippable, PATCH profile | mock |
| DEV-S04 | **CS-M11-S03** Home C03 | hero, formules, next booking, tabs | snapshot/UI test |
| DEV-S05 | **CS-M11-S04** C04–C07 | catalog, config+quote live, address+zone, slots | unit quote reducer |
| DEV-S06 | Hors zone | lead email | mock lead |
| DEV-S07 | **CS-M11-S05** C08 Stripe PaymentSheet | create booking + sheet | mock payment success/fail |
| DEV-S08 | **CS-M11-S06** C09 Confirmation | ref CS-…, CTA suivi | — |
| DEV-S09 | **CS-M11-S07** C10 Timeline | poll/refresh statuses | unit timeline map |
| DEV-S10 | **CS-M11-S08** C11 Avis | tags + note | unit validation |
| DEV-S11 | **CS-M11-S09** C12 Liste | segments + empty state | — |
| DEV-S12 | **CS-M11-S10** C13 Profil | adresses CRUD, delete account | mock delete |
| DEV-S13 | **CS-M11-S11** Push client | register Expo token | mock register |
| DEV-S14 | **CS-M11-S12** Places C06 | autocomplete (clé Google) | mock suggestions si pas de clé |

**Ordre d’exécution recommandé :** S01 → S02 → S03/S04 → S05 → S07 → S08 → S09 → S11 → S12 → S06 → S10 → S13 → S14.

### Phase 4 — Tests

| ID | Tâche | Outil | Critère |
|----|--------|-------|---------|
| TEST-01 | Jest config mobile-client | jest-expo | `pnpm test` filtre OK |
| TEST-02 | Unit composants Button/Otp/EmptyState | RNTL | verts |
| TEST-03 | Unit hooks auth + booking wizard | Jest | verts |
| TEST-04 | Unit mapping erreurs API | Jest | codes couverts |
| TEST-05 | Intégration mock repositories | Jest | flows book sans réseau |
| TEST-06 | Intégration API réelle (optionnel CI) | Jest + API up | skip si pas DB |
| TEST-07 | **E2E API** déjà existants restent verts | `pnpm --filter @carservice/api test:e2e` | gate backend |
| TEST-08 | **E2E mobile** parcours smoke | Maestro **ou** checklist manuelle SC-01 | doc résultats |
| TEST-09 | Checklist manuelle vs PDF (écran par écran) | `docs/ux/` | GO/NOGO signé |

### Phase 5 — Qualité / gate fin M11

| ID | Tâche | Critère |
|----|--------|---------|
| GATE-01 | Typecheck + lint mobile | OK | ✅ |
| GATE-02 | Parcours mock bout-en-bout (OTP fake → pay mock → suivi) | Démo 3 min | checklist dans smoke |
| GATE-03 | Parcours API réelle seed Lyon (OTP e2e pepper / Twilio mock) | Réservation créée en DB | ✅ `./tools/smoke-m11-gate03.sh` |
| GATE-04 | Fichier e2e ou doc `m11-client-smoke.md` | Présent | ✅ `docs/qa/m11-client-smoke.md` |
| GATE-05 | Suivi piste N cochée + commit | Push `main` | ✅ |

---

## 4. Mocks — contenu minimal

Dossier cible : `apps/mobile-client/src/mocks/`

| Fichier | Contenu |
|---------|---------|
| `offers.json` | 4 formules (29 / 39 / 59 / 129 €) |
| `quote.json` | breakdown + durationMinutes |
| `slots.json` | grille J→J+14 |
| `bookings.json` | 1 upcoming + empty list helper |
| `profile.json` | Claire + adresses |
| `otp.ts` | code fixe `000000` en mock |

Toggle : `EXPO_PUBLIC_USE_MOCKS=true` → repositories mock ; `false` → `api.*`.

---

## 5. Variables d’environnement mobile

```bash
# apps/mobile-client/.env.example
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000
EXPO_PUBLIC_USE_MOCKS=true
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_GOOGLE_PLACES_KEY=
```

---

## 6. Risques & décisions

| Risque | Mitigation |
|--------|------------|
| Device physique + localhost | Utiliser IP LAN dans `EXPO_PUBLIC_API_URL` |
| Stripe PaymentSheet natif | Mock pay d’abord ; Stripe test keys ensuite |
| Places sans clé | Autocomplete mock + saisie manuelle adresse |
| Pas de Figma | PDF = référence visuelle unique |
| Crédits UX Pilot épuisés | Plus de regen UI ; écarts = tickets DS |

---

## 7. Planning indicatif (points)

| Lot | Contenu | Pts ~ |
|-----|---------|-------|
| A | ENV + DS + ARCH + mocks | 8 |
| B | Auth + Home + tabs | 8 |
| C | Booking C04–C09 | 13 |
| D | Suivi + avis + list + profil | 8 |
| E | Push + Places + gate tests | 5 |
| | **Total M11** | **~42** |

---

## 8. Prochaine action immédiate

1. Cocher Phase 0 (ENV)  
2. Ouvrir **CS-M11-S01** : Expo Router + tokens + structure `app/`  
3. Brancher mocks  
4. Enchaîner Auth (S02)

Quand ce cahier est validé → démarrer le code sur S01.
