# M11 — Smoke mobile client (gate fin de module)

> App : `apps/mobile-client` · Stories : CS-M11-S01 → S12 · Date gate : 2026-09-16

## Prérequis

```bash
# apps/mobile-client/.env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000
EXPO_PUBLIC_USE_MOCKS=true
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_GOOGLE_PLACES_KEY=
```

```bash
pnpm --filter @carservice/mobile-client typecheck
pnpm --filter @carservice/mobile-client test
pnpm --filter @carservice/mobile-client build
pnpm --filter @carservice/mobile-client dev -- --clear
```

OTP mock : `000000`

---

## GATE-01 — Automatisé

| Check | Commande | Résultat |
|-------|----------|----------|
| Typecheck | `pnpm --filter @carservice/mobile-client typecheck` | ✅ |
| Unit tests | `pnpm --filter @carservice/mobile-client test` | ✅ (72) |
| Build (tsc) | `pnpm --filter @carservice/mobile-client build` | ✅ |

---

## GATE-02 — Parcours mock bout-en-bout (manuel ~3 min)

| # | Étape | Attendu | GO |
|---|--------|---------|----|
| 1 | Login téléphone + OTP `000000` | Tabs Accueil | ☐ |
| 2 | Accueil → réserver / Formule | Liste formules | ☐ |
| 3 | Formule → Config → quote live | Prix TTC affiché | ☐ |
| 4 | Adresse : taper `République` → suggestion | Remplit ville/CP Lyon | ☐ |
| 5 | Vérifier zone | Créneau | ☐ |
| 6 | Créneau → Paiement → CGV → Payer | Confirmation (pas retour Formule) | ☐ |
| 7 | Suivre ma réservation | C10 timeline + retour `‹` | ☐ |
| 8 | Réservations : À venir / Passées / Annulées | 3 segments peuplés mock | ☐ |
| 9 | Passées → Prestige → Laisser un avis | Note + tags → Merci | ☐ |
| 10 | Profil → Mes adresses → retour | Liste + back OK | ☐ |
| 11 | Profil → Activer les notifications | Alerte mock OK | ☐ |

**Résultat démo :** GO / NOGO — _______ (date / testeur)

---

## GATE-03 — API réelle (optionnel hors mocks)

Prérequis : API up + seed Lyon (+ pro démo éligible), `EXPO_PUBLIC_USE_MOCKS=false`, OTP dans logs API (`[DEV OTP]`).

| Check | Attendu | Résultat 2026-09-16 |
|-------|---------|---------------------|
| Auth OTP réel / pepper | Session JWT | ✅ |
| Booking create + PaymentSheet test | Booking en DB `pending_provider` | ✅ `CS-20260917-1A78` |
| GET booking detail | Timeline API | ✅ |

Automatisé : `./tools/smoke-m11-gate03.sh` (inject OTP Redis + create booking + assert Postgres).

Mobile UI : `EXPO_PUBLIC_USE_MOCKS=false` dans `apps/mobile-client/.env`, restart Expo, OTP = ligne `[DEV OTP]` des logs API.

Statut gate M11 : **GO API** (script) · checklist manuelle app = à rejouer sur device.

---

## GATE-04 — Artefact

Ce fichier : `docs/qa/m11-client-smoke.md`

---

## GATE-05 — Suivi

- Stories CS-M11-S01…S12 cochées dans [suivi-taches.md](../backlog/suivi-taches.md)
- Commit gate poussé sur `main`

---

## Routes couvertes (smoke)

| Route | Écran |
|-------|-------|
| `/(auth)/login` | C01 |
| `/(tabs)` | C03 |
| `/book/*` | C04–C09 |
| `/bookings/[id]` | C10 |
| `/bookings/[id]/review` | C11 |
| `/(tabs)/bookings` | C12 |
| `/(tabs)/profile` + `/account/*` | C13 |

---

## Notes connues

- Push natif : `expo-notifications` en deps ; en mocks le register est simulé (install store peut échouer en sandbox CI locale).
- Places : sans `EXPO_PUBLIC_GOOGLE_PLACES_KEY` → suggestions mock Lyon (+ Paris hors zone).
- Stripe PaymentSheet : mock si mocks on ou clé absente.
