# Guide Mobile Pro — CARSERVICE

> **App :** `apps/mobile-provider` · **Stack :** Expo · Expo Router · TanStack Query

Application dédiée aux **professionnels** lavage mobile — missions, KYC, exécution, gains.

---

## 1. Objectif app

Permettre au pro de **recevoir, accepter et exécuter** des missions, avec **clôture documentée** (photos + checklist) et **suivi des gains**.

---

## 2. Écrans MVP

| Route | Écran CDC | Priorité |
|-------|-----------|----------|
| `app/index.tsx` | P00 Splash | P0 |
| `app/(auth)/login.tsx` | P00 Auth OTP | P0 |
| `app/(kyc)/wizard/[step].tsx` | P01 KYC 7 écrans | P0 |
| `app/(kyc)/pending.tsx` | Attente validation | P0 |
| `app/(kyc)/rejected.tsx` | Dossier refusé | P0 |
| `app/(kyc)/connect.tsx` | Stripe Connect (pas de Skip) | P0 |
| `app/(tabs)/missions.tsx` | P02 Missions | P0 |
| `app/missions/[id].tsx` | P03 Détail (avant accept) | P0 |
| `app/missions/[id]/active.tsx` | P04 En route / arrivé | P0 |
| `app/missions/[id]/execute.tsx` | P05 Checklist + photos | P0 |
| `app/missions/[id]/done.tsx` | P06 Clôture | P0 |
| `app/(tabs)/planning.tsx` | P07 Planning | P1 |
| `app/(tabs)/gains.tsx` | P08 Gains | P1 |
| `app/(tabs)/profil.tsx` | P09 Profil | P1 |
| `app/profil/notifs.tsx` | P09b Toggles | P0 |

Tabs bas **uniquement** après KYC approved + Connect `charges_enabled` : Missions \| Planning \| Gains \| Profil.

Maquettes : [`docs/ux/uxpilot-pro-html-v2/`](../ux/uxpilot-pro-html-v2/) · cahier : [`docs/backlog/m12-cahier.md`](../backlog/m12-cahier.md).

---

## 3. Flow KYC (P01)

Wizard 7 étapes — **bloquant** tant que `kyc_status !== approved`

| Step | Champs | Validation |
|------|--------|------------|
| 1 | companyName, siret | SIRET 14 chiffres (IBAN via Connect, pas ici) |
| 2 | rcPro document upload | PDF/JPG, expiry date |
| 3 | washMethods[] | min 1: waterless|steam |
| 4 | zones + base address | map radius |
| 5 | capabilities (offers) | min 1 formule |
| 6 | availability slots | min 1 plage/semaine |
| 7 | avatar, bio | photo optionnelle |

Upload docs via presigned URL API.

---

## 4. Missions — logique UI

### Liste P02 (tabs segment)
- **Nouvelles** : `GET /bookings/available` — badge count
- **À venir** : accepted, slot future
- **En cours** : in_progress today

### Détail P03
- Broadcast ~8 pros, **premier Accepter gagne** (fenêtre minutes). **Pas** de chrono 8 s Uber.
- Helper : « Plusieurs pros voient cette mission… »
- **Pas d’adresse exacte** avant accept (RG-SEC-02) — quartier seulement, pas de carte immeuble
- Afficher gain **net** après commission (API, jamais calculé ici)

### Active P04
- Adresse complète après accept
- CTA morph : `En route` → `Arrivé` → redirect execute
- Bouton Maps externe + tel client

### Execute P05
- Checklist from `offer.checklistTemplate` API
- Photos : min 2 before + 2 after (compteur UI)
- CTA "Terminer" disabled jusqu’à valid

---

## 5. Stripe Connect onboarding

- Au KYC approved : écran **Activer les virements** — **pas de Skip**
- `POST /providers/stripe/onboard` puis Account Link (`expo-web-browser`)
- Retour app → re-fetch `chargesEnabled` / eligibility. Sans Connect → pas de P02

---

## 6. Notifications (critiques pro)

| Event | Priorité push |
|-------|---------------|
| Nouvelle mission | High + sound |
| Rappel H-1 | Default |
| KYC approved/rejected | Default |
| Payout | Default |

**Permission push** demandée après KYC step 1 (contexte clair).

---

## 7. Différences vs app Client

| Aspect | Client | Pro |
|--------|--------|-----|
| Bundle ID | `fr.carservice.client` | `fr.carservice.provider` |
| Role JWT | `client` | `provider` |
| Tab bar | Accueil, Réservations, Profil | Missions, Planning, Gains, Profil |
| Stripe | PaymentSheet | Connect onboarding |
| KYC | Non | Oui |

---

## 8. Shared code

Extraire dans `packages/` :
- `api-client`
- `shared-types`
- `ui-tokens`
- Composants communs : Button, Input, Avatar → `packages/mobile-ui` (si ≥ 3 partagés)

**Ne pas partager** : écrans booking wizard vs mission execute.

---

## 9. Checklist Pro app

- [ ] KYC wizard complet
- [ ] Accept/decline avec lock concurrence
- [ ] Photos upload S3
- [ ] Push nouvelle mission < 5 s latency
- [ ] Gains affichés post-capture
- [ ] Mode avion : message clair sur missions

---

→ [Guide Client](guide-mobile-client.md) · [Guide API](guide-api-backend.md)
