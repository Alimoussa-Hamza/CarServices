# Prochaines tâches — post M11

> Plan séquencé (exécuté une tâche à la fois). Mis à jour au fil de l’eau.
> Origine : gate M11 fermée · client encore en mocks.

**Légende :** `[x]` fait · `[~]` en cours · `[ ]` à faire · `[!]` bloqué

---

## Ordre d’exécution

| # | ID | Tâche | Dépendances | Statut |
|---|-----|--------|-------------|--------|
| 1 | **T01** | GATE-03 — Brancher mobile-client sur API + DB réelle | Docker Postgres + API up + seed Lyon | `[x]` |
| 2 | **T02** | M13-S01 — Setup admin Next.js + shadcn + auth | Backend M10 ✅ | `[x]` |
| 3 | **T03** | M13-S02 — Dashboard KPIs (A02) | T02 | `[x]` |
| 4 | **T04** | M13-S03 — Validation KYC pros (A03) | T02 | `[x]` |
| 4b | **T04b** | M13-S04 — CRUD catalog (A04) | T02 | `[x]` |
| 4c | **T04c** | M13-S05 — Zones + pricing (A05) | T02 | `[x]` |
| 5 | **T05** | Maquettes M12 prêtes (UX Pilot) → démarrer M12-S01 | Hors code / UX | `[ ]` |
| 6 | **T06** | M14 restant — EAS preview, SC staging, stores | T01 vert + apps stables | `[ ]` |

---

## T01 — GATE-03 API réelle (mobile-client)

**But :** prouver qu’une réservation créée depuis l’app existe en Postgres.

### Checklist

- [x] API Nest rebuild (AddressesModule) sur `:3000`
- [x] Seed Lyon + **pro démo éligible** (`prisma/seed.ts` → `+33600000001`)
- [x] `apps/mobile-client/.env` → `EXPO_PUBLIC_USE_MOCKS=false`
- [x] Auth OTP → adresse → slots → booking → Postgres (`pending_provider`)
- [x] GET détail booking OK
- [x] Script `./tools/smoke-m11-gate03.sh`
- [x] Doc `docs/qa/m11-client-smoke.md` GATE-03 = GO
- [ ] Parcours **manuel** Expo (OTP log API) — à faire sur device après restart Expo

### Critères de done

1. ~~Login OTP hors mock~~ ✅ (script + JWT)
2. ~~Au moins 1 booking en DB~~ ✅
3. ~~Smoke GATE-03 GO~~ ✅ (API) · UI manuelle restante

---

## T02 — CS-M13-S01 Setup admin

**But :** socle `apps/admin` authentifié contre l’API (JWT admin).

### Checklist

- [x] Login `/login` → `POST /auth/admin/login`
- [x] Session localStorage + `initApiClient`
- [x] Shell nav (dashboard / kyc / catalog / zones / bookings / disputes / settings)
- [x] Composants UI style shadcn (Button, Input, Label, Card) via `ui-tokens`
- [x] Tests auth-storage + typecheck + build
- [x] Commit + push

Note : Tailwind/shadcn CLI complet reporté — composants maison alignés tokens (évite dette install).

---

## T03 — CS-M13-S02 Dashboard KPIs

**But :** A02 back-office branché sur `GET /admin/dashboard`.

### Checklist

- [x] Cartes GMV J/7j/30j, bookings, acceptation, matching, litiges, KYC
- [x] Barres GMV 30 j + table statuts FR
- [x] Tests format + typecheck + build
- [x] 401/403 → login

---

## T04 — CS-M13-S03 KYC validation

**But :** A03 file `submitted` + viewer docs + approve/reject (motif ≥ 5).

### Checklist

- [x] Liste pending `GET /admin/providers/pending`
- [x] Fiche + documents (image / lien)
- [x] Approuver / Refuser + motif
- [x] Tests kyc helpers + typecheck + build

---

## T04b — CS-M13-S04 Catalogue

**But :** A04 catégories / offres / options (soft-disable).

### Checklist

- [x] Liste + toggle catégorie
- [x] Créer / éditer offre + options
- [x] Tests slug/prix + typecheck + build

---

## T04c — CS-M13-S05 Zones + pricing

**But :** A05 coefficient, délai, activation, pricing par offre (polygone = copie Lyon, pas de carte).

### Checklist

- [x] Liste zones + toggle + coeff / lead
- [x] Créer zone (copie polygone, inactive)
- [x] Pricing override + surcharges véhicule
- [x] Tests parse + typecheck + build

---

## T05 — Maquettes M12

Hors repo code : finaliser UX Pilot pro → puis `CS-M12-S01`.

---

## T06 — M14 launch

EAS / SC-01…06 staging / stores — après T01 et apps stables.

---

## Journal d’exécution

| Date | Tâche | Notes |
|------|-------|-------|
| 2026-09-16 | T01 démarré | Docker CLI inaccessible sandbox ; Postgres/Redis déjà up |
| 2026-09-16 | T01 API GO | Rebuild API, booking `CS-20260917-1A78`, script smoke-m11-gate03 |
| 2026-09-16 | T02 done | Login admin + shell + placeholders routes |
| 2026-09-17 | T03 done | Dashboard A02 `GET /admin/dashboard` |
| 2026-09-17 | T04 done | KYC pending + approve/reject |
| 2026-09-17 | T04b done | Catalogue admin A04 |
| 2026-09-17 | T04c done | Zones + pricing A05 |
