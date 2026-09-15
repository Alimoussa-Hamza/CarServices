# Guide QA & Tests — CARSERVICE

> **Phase :** opérationnelle · Stratégie tests, plans, critères qualité  
> **Référentiel API détaillé :** [docs/qa/](../qa/README.md) (cahier · matrice · procédures)

---

## 1. Pyramide de tests

```
        ┌─────────┐
        │  E2E    │  Peu — flows critiques
        ├─────────┤
        │ Intégr. │  API + DB, webhooks
        ├─────────┤
        │  Unit   │  State machine, pricing, validators
        └─────────┘
```

**MVP focus :** unit + intégration API. E2E HTTP (`supertest`, DB réelle) à **chaque fin de module** (`apps/api/test/e2e/mxx-*.e2e-spec.ts`). Smoke staging : `./tools/smoke-api.sh`. E2E mobile Maestro = phase 2.

Cas de tests nommés (TC-*) et couverture endpoint : [cahier-de-tests-api.md](../qa/cahier-de-tests-api.md) · [matrice-couverture-api.md](../qa/matrice-couverture-api.md).

---

## 2. Tests par couche

### API (`apps/api`)

| Cible | Type | Priorité |
|-------|------|----------|
| `BookingStateMachine` | Unit | P0 |
| `PricingService.quote` | Unit | P0 |
| `MatchingService.filterEligible` | Unit | P0 |
| `POST /bookings` | Integration | P0 |
| Stripe webhook handler | Integration (mock) | P0 |
| OTP rate limit | Integration | P1 |
| Admin refund | Integration | P1 |

**Outils :** Jest, Supertest, testcontainers PostgreSQL (ou DB test dédiée)

### Mobile Client / Pro

| Cible | Type | Priorité |
|-------|------|----------|
| Hooks (useQuote, useBookingDraft) | Unit | P1 |
| Zod form validation | Unit | P1 |
| Composants critiques (Payment) | RNTL | P2 |
| Flow réservation | E2E Maestro | P2 |

### Admin

| Cible | Type | Priorité |
|-------|------|----------|
| Form validation catalog | Unit | P1 |
| Table filters | Component | P2 |

### Packages shared-types

| Cible | Type |
|-------|------|
| Schema parse valid/invalid | Unit |

---

## 3. Scénarios E2E manuels (staging)

### SC-01 — Réservation happy path client
1. OTP login client
2. Choisir Lavage complet SUV + option
3. Adresse Lyon couverte
4. Créneau J+1 10h
5. Payer carte test 4242
6. Vérifier booking `pending_provider`

### SC-02 — Pro accepte et clôture
1. Login pro approved
2. Voir mission SC-01
3. Accepter → en route → in progress
4. Upload 2+2 photos, checklist
5. Terminer → booking `completed`
6. Vérifier capture Stripe dashboard

### SC-03 — Hors zone
1. Adresse hors polygone
2. Message + pas de paiement possible

### SC-04 — Annulation > 24h
1. Annuler booking future
2. Auth Stripe released

### SC-05 — KYC reject
1. Admin reject pro
2. Pro ne voit pas missions

### SC-06 — Litige
1. Client ouvre litige post-completed
2. Versement pro gelé
3. Admin resolve refund

---

## 4. Tests règles métier (mapping RG)

| RG | Test |
|----|------|
| RG-CAT-03 | Snapshot prix immuable après create |
| RG-MATCH-03 | Un seul pro accepte |
| RG-MATCH-05 | Timeout → unassigned |
| RG-BOOK-04 | Clôture sans photos → 400 |
| RG-CANCEL | Frais selon délai |
| RG-PAY-02 | Capture only on completed |
| RG-KYC-01 | Pro draft → 403 missions |

---

## 5. Données test

**Fixtures seed :**
- Client : `+33600000001`
- Pro 1 approved : `+33600000002`
- Pro 2 pending KYC : `+33600000003`
- Admin : `admin@carservice.fr`
- Zone : Lyon test polygon
- Stripe : toujours test mode staging

**Ne jamais** utiliser données prod en staging sans anonymisation.

---

## 6. Performance (seuils MVP)

| Endpoint | p95 cible |
|----------|-----------|
| GET /catalog/offers | < 200 ms |
| POST /catalog/quote | < 300 ms |
| POST /bookings | < 800 ms |
| GET /bookings/:id | < 150 ms |

Load test phase 2 : k6 — 50 RPS simulate (`tools/load-k6.js`, warn si hors seuil).

```bash
# API démarrée + seed
k6 run tools/load-k6.js
API_URL=http://localhost:3000/api/v1 k6 run tools/load-k6.js
```

---

## 7. Definition of Done (qualité)

Story done si :
- [ ] Tests unit/intégration ajoutés (P0 logic)
- [ ] SC manuel passé si flow user-facing
- [ ] Pas regression lint/typecheck
- [ ] Sentry sans new unhandled errors staging 24h

---

## 8. Bug severity

| Sev | Exemple | SLA fix |
|-----|---------|---------|
| S1 | Paiement double, fuite data | < 4 h |
| S2 | Impossible réserver | < 24 h |
| S3 | UI glitch, typo | Sprint courant |
| S4 | Cosmétique | Backlog |

---

## 9. Outils recommandés

| Outil | Usage |
|-------|-------|
| Jest | Unit/API |
| Supertest | HTTP API E2E (`apps/api/test/e2e`) |
| `tools/smoke-api.sh` | Smoke staging/local post-deploy |
| `docs/qa/` | Cahier TC + matrice couverture |
| React Native Testing Library | Mobile components |
| Maestro | Mobile E2E (phase 2) |
| Stripe CLI | Webhook local test |
| Postman/Bruno | Collection API manuelle |

Collection Postman : `docs/postman/carservice.postman_collection.json`.

---

→ [Backlog](../backlog-mvp.md) · [Règles gestion](../regles-de-gestion.md)
