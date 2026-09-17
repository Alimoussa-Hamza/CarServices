# Guide Admin Web — CARSERVICE

> **App :** `apps/admin` · **Stack :** Next.js 15 App Router · shadcn/ui · TanStack Table

Back-office opérationnel — validation pros, catalogue, bookings, litiges, config plateforme.

---

## 1. Objectif

Permettre à 1–2 opérateurs de **piloter la marketplace** sans accès base de données direct.

---

## 2. Écrans (mapping CDC A01–A09)

| Route Next.js | Écran | Fonctions |
|---------------|-------|-----------|
| `/login` | A01 | Auth admin (email + 2FA recommandé) |
| `/` | A02 | Dashboard KPIs |
| `/providers` | A03 | Liste pros + filtres KYC |
| `/providers/[id]` | A03 | Viewer docs, approve/reject |
| `/catalog/offers` | A04 | CRUD offres + options |
| `/catalog/categories` | A04 | Catégories (wash enabled) |
| `/zones` | A05 | Polygones, coefficients prix |
| `/bookings` | A06 | Recherche, détail, reassign |
| `/bookings/[id]` | A06 | Timeline, refund, force cancel |
| `/disputes` | A07 | File litiges + résolution |
| `/reviews` | A08 | Modération avis |
| `/settings` | A09 | Commission, timeouts, feature flags |

---

## 3. Architecture Next.js

```
app/
├── (auth)/login/
├── (dashboard)/          # layout avec sidebar
│   ├── layout.tsx
│   ├── page.tsx
│   ├── providers/
│   ├── catalog/
│   ├── zones/
│   ├── bookings/
│   ├── disputes/
│   ├── reviews/
│   └── settings/
middleware.ts             # protect (dashboard)/*
```

**Auth :** session httpOnly cookie OU JWT server-side — pas de token admin dans localStorage.

---

## 4. Patterns UI

| Pattern | Usage |
|---------|-------|
| DataTable | Listes providers, bookings, disputes |
| Sheet / Dialog | Détail rapide, actions |
| Form + Zod | CRUD catalog, settings |
| Badge | Statuts booking, KYC |
| Toast | Confirmations actions |

Composants : **shadcn/ui** — Button, Table, Dialog, Form, Select, Badge, Tabs.

---

## 5. KPIs Dashboard (A02)

| KPI | Source API |
|-----|------------|
| GMV jour / semaine / mois | `GET /admin/dashboard` |
| Bookings count by status | idem |
| Taux acceptation pro | idem |
| Délai matching médian | idem |
| Litiges ouverts | idem |
| Pros pending KYC | idem |

Graphiques : recharts ou tremor — line GMV 30j, bar bookings/status.

---

## 6. Actions sensibles (audit log)

Toute action admin loggée côté API :
- KYC approve/reject
- Refund
- Force cancel
- Hide review
- Config change

Afficher historique sur fiche booking/provider (phase 1.5).

---

## 7. Carte zones (A05)

- Editor polygone : Mapbox GL Draw ou Google Maps Drawing
- Alternative MVP : liste codes postaux + rayon (plus simple)
- Preview zone sur carte

---

## 8. Sécurité admin

- Rôle `admin` uniquement sur routes `/admin/*` API
- 2FA TOTP (phase 1.5 — recommandé avant prod)
- IP allowlist optionnel
- Session timeout 8 h
- CSP strict headers

---

## 9. Responsive

- **Desktop-first** (1280 px) — usage principal bureau
- Tablet OK ; mobile non prioritaire

---

## 10. Checklist admin prêt

- [ ] Login + middleware protection
- [ ] CRUD catalog fonctionnel staging
- [ ] Approve/reject KYC avec motif
- [x] Refund Stripe depuis booking detail
- [x] File litiges + résolution (client / pro / split)
- [x] Settings commission modifiable sans redeploy
- [ ] RBAC si multi-admin (phase 2)

---

→ [Wireframes admin](../cahier-des-charges.md#9-spécifications-fonctionnelles--écrans-admin) · [Contrat API](../api-contrat-v1.md)
