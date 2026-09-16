# Prochaines tâches — post M11

> Plan séquencé (exécuté une tâche à la fois). Mis à jour au fil de l’eau.
> Origine : gate M11 fermée · client encore en mocks.

**Légende :** `[x]` fait · `[~]` en cours · `[ ]` à faire · `[!]` bloqué

---

## Ordre d’exécution

| # | ID | Tâche | Dépendances | Statut |
|---|-----|--------|-------------|--------|
| 1 | **T01** | GATE-03 — Brancher mobile-client sur API + DB réelle | Docker Postgres + API up + seed Lyon | `[x]` |
| 2 | **T02** | M13-S01 — Setup admin Next.js + shadcn + auth | Backend M10 ✅ | `[~]` |
| 3 | **T03** | M13-S02 — Dashboard KPIs (A02) | T02 | `[ ]` |
| 4 | **T04** | M13-S03 — Validation KYC pros (A03) | T02 | `[ ]` |
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

### Checklist (à détailler au démarrage T02)

- [ ] Lire story CS-M13-S01 + contrat auth admin
- [ ] Auth login admin (OTP ou credentials selon contrat)
- [ ] Layout shell + navigation
- [ ] Tests + typecheck + build
- [ ] Commit + push

---

## T03 — CS-M13-S02 Dashboard KPIs

Bloqué jusqu’à T02.

---

## T04 — CS-M13-S03 KYC validation

Bloqué jusqu’à T02 (peut être parallèle à T03).

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
| 2026-09-16 | T02 démarré | Suite immédiate après commit T01 |
