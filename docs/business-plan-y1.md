# Business plan Y1 — CARSERVICE (synthèse)

> **Version :** 1.0 · **Horizon :** 12 mois · **Périmètre :** lavage à domicile, 1 ville puis extension

---

## 1. Modèle économique

| Flux | Détail |
|------|--------|
| **Revenu principal** | Commission 20 % sur chaque prestation |
| **Revenu secondaire** | Frais de service client 2 € / booking (optionnel) |
| **Phase 2** | Abonnements lavage, contrats flottes B2B |

---

## 2. Hypothèses marché (ville pilote)

| Paramètre | Hypothèse conservative | Hypothèse optimiste |
|-----------|------------------------|---------------------|
| Population zone | 500 000 | 500 000 |
| Pénétration Y1 | 0,5 % | 1,5 % |
| Clients actifs | 2 500 | 7 500 |
| Bookings / client / an | 4 | 6 |
| Panier moyen TTC | 85 € | 95 € |
| GMV annuel | 850 000 € | 4,3 M€ |
| Commission 20 % | 170 000 € | 860 000 € |

---

## 3. Unit economics (par booking)

```
Panier client TTC        85,00 €
Commission plateforme    17,00 €  (20 %)
Frais service (opt.)      2,00 €
─────────────────────────────────
Revenu plateforme        19,00 €

Coûts variables estimés :
  Stripe (~1,5 % + 0,25 €)  ~1,53 €
  SMS / notif               ~0,10 €
  Maps / infra marginal     ~0,05 €
─────────────────────────────────
Marge contribution         ~17,32 €  (~91 %)
```

**CAC cible :** < 20 € (Meta/Google local, bouche-à-oreille)  
**LTV estimée :** 4 bookings × 17 € = **68 €** (sans abonnement)  
**Ratio LTV/CAC :** > 3 ✅

---

## 4. Coûts fixes Y1 (ordre de grandeur)

| Poste | Mensuel | Annuel |
|-------|---------|--------|
| Infra (API, DB, storage) | 100–300 € | 1 200–3 600 € |
| Stripe (fixe minimal) | — | — |
| SMS / email | 50–200 € | 600–2 400 € |
| Google Maps | 50–300 € | 600–3 600 € |
| Sentry / outils | 30–100 € | 360–1 200 € |
| Stores (Apple + Google) | — | ~120 € |
| Comptabilité / juridique | 100–300 € | 1 200–3 600 € |
| Marketing launch | 500–2 000 € | 6 000–24 000 € |
| **Total OPEX tech+ops** | **~830–3 200 €** | **~10–40 k€** |

**Hors :** salaires fondateurs / dev (variable selon équipe).

---

## 5. Côté supply (pros)

| Métrique | Cible MVP |
|----------|-----------|
| Pros actifs ville pilote | 15–30 |
| Missions / pro / semaine | 5–15 |
| Revenu net pro / mission | ~68 € (sur panier 85 €) |
| Revenu pro mensuel (10 missions/sem) | ~2 700 € net |

**Seuil activation :** ≥ 10 pros KYC approved avant marketing client agressif.

---

## 6. Seuil de rentabilité (plateforme seule)

```
Coûts fixes mensuels ~ 1 500 € (hypothèse basse)
Marge / booking ~ 17 €
─────────────────────────
Bookings / mois breakeven ≈ 88
≈ 22 bookings / semaine
```

Avec 20 pros à 1–2 missions/jour → atteignable mois 6–9 post-launch.

---

## 7. Risques business

| Risque | Mitigation |
|--------|------------|
| Chicken & egg | Recruter pros avant clients (3 mois pre-launch) |
| Saisonnalité | Push intérieur hiver, detailing printemps |
| Concurrence locale | Différenciation app + assurance + éco |
| Commission trop haute | Démarrer 15–18 %, monter à 20 % |

---

## 8. KPIs à suivre (dashboard admin)

| KPI | Cible M3 | Cible M12 |
|-----|----------|-----------|
| GMV mensuel | 15 k€ | 70 k€ |
| Bookings / mois | 180 | 850 |
| Taux acceptation pro | > 70 % | > 85 % |
| Délai matching médian | < 30 min | < 15 min |
| NPS client | > 40 | > 50 |
| Note pro moyenne | > 4,2 | > 4,5 |
| Taux annulation | < 10 % | < 8 % |

---

## 9. Plan de financement MVP

| Phase | Besoin | Usage |
|-------|--------|-------|
| Pre-launch (3 mois dev) | Bootstrap / love money | Dev, design, infra |
| Launch (M1–M3) | Marketing 5–10 k€ | Acquisition pros + clients |
| Scale (M4–M12) | Réinvestissement commission | 2e ville |

---

→ [Backlog MVP](backlog-mvp.md) · [Checklist pré-dev](checklist-pre-developpement.md)
