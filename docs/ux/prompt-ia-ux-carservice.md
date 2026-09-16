# Prompt UX Pilot — CarWash (tout expliquer)

> **Outil :** [UX Pilot](https://uxpilot.ai) (Hi-fi Design · Autoflow · Theme · Section Edit · export Figma)  
> **Prompt unique prêt à coller (recommandé) :** [uxpilot-prompt-complet.md](uxpilot-prompt-complet.md)  
> **Produit :** marketplace lavage auto à domicile éco (sans eau / vapeur), France, MVP
> **UI copy :** français · **IDs écrans :** C00–C14 / P00–P09 / A01–A09  
> **Docs métier :** [cahier-des-charges](../cahier-des-charges.md) · [guide-ux](../guides/guide-ux-design.md) · [spec-figma](../spec-figma.md)

---

## 1. Comment utiliser dans UX Pilot (ordre recommandé)

1. **Nouveau fichier** → **Hi-fi Design**
2. Coller d’abord le **Prompt A — Contexte produit + thème** (ou remplir Theme Editor avec les hex ci-dessous)
3. Générer **un Autoflow à la fois** (ne pas mélanger Client + Pro + Admin dans le même run) :
   - Prompt B → Mobile Client
   - Prompt C → Mobile Pro
   - Prompt D → Desktop Admin
4. Activer **Autoflow** pour enchaîner les écrans listés
5. Affiner avec les **Prompts E — Section Edit** (écran par écran)
6. **Generate Prototype** quand les écrans sont bons → export Figma

Astuce UX Pilot : si le brief est trop long, colle le Prompt A, clique **Enhance Prompt**, puis ajoute la liste d’écrans du Prompt B/C/D.

---

## 2. Theme Editor / brand (à saisir une fois)

| Token | Hex | Usage |
|-------|-----|--------|
| Primary | `#0D6E4F` | CTA, stepper actif |
| Primary light | `#E8F5F0` | fonds doux, badge éco |
| Primary dark | `#094D38` | pressed |
| Secondary | `#1A3A5C` | titres / accent Pro |
| Accent | `#F5A623` | badge « Populaire » seulement |
| Text | `#1A1A2E` | titres |
| Text muted | `#4A4A68` | secondaire |
| Border | `#D1D1DE` | dividers |
| BG | `#FFFFFF` / `#F4F4F8` | surfaces |
| Success / Warning / Error | `#2E7D4F` / `#E67E22` / `#D32F2F` | statuts |

- **Mode :** Light (pas dark par défaut)
- **Style :** premium-accessible, lumineux, éco, confiance (type Uber clarté + Doctolib confiance + Alan douceur — **ne pas copier**)
- **Typo :** display géométrique calme (Satoshi / General Sans) + body lisible (Geist / Plex / system) — **éviter Inter seul**
- **Radius :** moyen (8–12), pas pill everywhere
- **Shadows :** légères, 1 niveau max

---

## 3. Prompt A — Contexte produit (coller en premier)

```
Product: CarWash
Type: Marketplace mobile-first for eco car wash AT HOME (waterless and/or steam ONLY). France. French UI copy.

Promise: « Lavage auto à domicile, éco et assuré »
Positioning: trust + simplicity + ecology. Premium-accessible, NEVER cheap garage discount, NEVER aggressive sales UI.

Who uses it:
1) Client (Claire, 34, Lyon, iPhone) books wash without going to a station. Budget 70–120€ if trustworthy.
2) Pro (Marc, 28, Android) auto-entrepreneur waterless washer — gets missions, KYC verified, guaranteed payout.
3) Admin ops — validates KYC, disputes, catalog, zones (dense desktop tool, NOT a marketing dashboard).

Core rules to show in UI:
- Fixed price BEFORE payment (no negotiated quotes)
- Pro verified: SIRET + RC Pro + eco method; client sees pro AFTER accept
- Payment: card pre-auth, capture when mission completed
- Mission timeline + push/SMS
- Photos before/after required to complete (min 2+2)
- Reviews within 72h; disputes within 48h after complete
- Out of zone: cannot pay; clear message + email lead capture
- MVP category: wash only, one pilot city

OUT of scope (do NOT invent): free chat, classic water wash, multi-country, B2B fleets, subscriptions, dark mode default.

Visual: bright airy whitespace; brand green #0D6E4F + navy #1A3A5C; real car/pro photography on client home hero ONLY as full-bleed; first mobile viewport = ONE composition (brand + 1 headline + 1 short line + 1 CTA + 1 dominant image) — no stats strip, no card collage in hero. No purple AI gradients, no neon glow, no emoji clutter.

All labels, buttons, empty/error states in FRENCH.
```

---

## 4. Prompt B — Autoflow Mobile CLIENT (Hi-fi · Mobile · Autoflow)

```
Platform: Mobile iOS/Android app, 390x844, light theme, French UI.
App: CarWash — client booking for eco car wash at home.
Brand: primary #0D6E4F, navy #1A3A5C, accent #F5A623 sparingly, white/#F4F4F8 backgrounds, calm premium eco look.

Bottom tabs: Accueil | Réservations | Profil
Booking wizard stepper (sticky bottom price when relevant): Formule → Config → Adresse → Créneau → Paiement

Generate a connected Autoflow with these screens IN ORDER (name frames Client-Cxx-Name):

1) Client-C00-Splash — logo CarWash + loader
2) Client-C01-Auth — phone E.164 + Send OTP + 6-digit code + checkbox CGU « J'accepte les CGU et la politique de confidentialité » + Continuer
3) Client-C02-Onboarding — prénom, véhicule optionnel, adresse favorite, skip « Plus tard »
4) Client-C03-Home — ONE hero composition: brand CarWash, headline « Lavage à domicile », subtitle « Pro certifié, sans eau, chez vous », CTA « Réserver maintenant », full-bleed clean car photo; below: badge « Zone couverte · Lyon », 3 popular formula cards, next booking card if any
5) Client-C04-Catalogue — list Extérieur express / Intérieur / Complet / Detailing with duration, « à partir de » price, badge Éco
6) Client-C05-Config — vehicle type (citadine/berline/SUV/utilitaire), dirt level, options toggles, comment, LIVE total TTC + duration, CTA Continuer
7) Client-C06-Adresse — Places search, digicode, access instructions, map pin; if covered show success; include secondary state note for hors zone message « Cette adresse n'est pas encore couverte. »
8) Client-C07-Creneau — 14-day calendar + time slots chips
9) Client-C08-Paiement — recap formula/options/address/slot, sticky footer « Payer {amount} », Stripe-like card sheet
10) Client-C09-Confirmation — reference CS-20260916-A1B2, status « Recherche d'un professionnel… », timeline start
11) Client-C10-Suivi — vertical timeline: Recherche pro → Pro confirmé → En route → Lavage en cours → Terminé; show address only after accepted; CTA support
12) Client-C11-Avis — stars 1–5, tags ponctualité/qualité/propreté, photo before/after gallery
13) Client-C12-Reservations — segments À venir / Passées / Annulées
14) Client-C13-Profil — infos, adresses, moyens de paiement, support, « Supprimer mon compte »

Components: sticky CTA, stepper, formula cards, status badges, price footer. Thumb-zone bottom CTAs. WCAG AA contrast. Do not invent chat or water-wash options.
```

---

## 5. Prompt C — Autoflow Mobile PRO (Hi-fi · Mobile · Autoflow)

```
Platform: Mobile Android/iOS, 390x844, light theme, French UI.
App: CarWash Pro — for eco mobile car wash professionals.
Brand: same green #0D6E4F with stronger navy #1A3A5C accents for pro identity. Dense but calm. Trust/ops feel.

Bottom tabs: Missions | Planning | Gains | Profil

Generate Autoflow screens IN ORDER (Pro-Pxx-Name):

1) Pro-P00-Auth — OTP phone like client, role provider
2) Pro-P01-KYC-Wizard — multi-step progress: (1) société/SIRET/IBAN (2) upload RC Pro + expiry date (3) methods sans eau/vapeur min 1 (4) zones + base address (5) formules capabilities (6) weekly availability (7) photo + bio. Banner if status submitted « Dossier en cours de validation ». Block missions until approved.
3) Pro-P02-Missions — tabs Nouvelles | À venir | En cours. Cards: time, QUARTIER only (mask full address), formula, net pay « Vous gagnez {amount} net », distance
4) Pro-P03-DetailAvantAccept — formula, options, vehicle, slot, approx zone, net pay, client comment; CTAs Accepter / Refuser
5) Pro-P04-MissionAcceptee — FULL address, digicode, client phone, Open Maps; CTAs « Je suis en route », « Je suis arrivé »
6) Pro-P05-Execution — checklist items, photo grid mandatory 2 before + 2 after with progress; CTA « Terminer la prestation » disabled until photos+checklist done
7) Pro-P06-Cloture — net amount, payout timing message, success
8) Pro-P07-Planning — week calendar + block slots
9) Pro-P08-Gains — balance in transit, Stripe payouts history
10) Pro-P09-Profil — rating, zones, documents, RC Pro J-30 warning banner

Show empty state for Nouvelles when KYC not approved. French microcopy. No free chat.
```

---

## 6. Prompt D — Autoflow Desktop ADMIN (Hi-fi · Desktop Web · Autoflow)

```
Platform: Desktop web admin 1440px, light theme, French UI.
App: CarWash Admin — internal ops console. Dense data UI like Stripe Dashboard / Linear — NOT a marketing site, no hero images, no big illustrations.

Left nav: Dashboard | Pros KYC | Catalogue | Zones | Bookings | Litiges | Avis | Config

Brand: #0D6E4F primary actions, navy headers, neutral tables #F4F4F8 zebra optional, clear status pills.

Generate Autoflow screens (Admin-Axx-Name):

1) Admin-A01-Login — email + password
2) Admin-A02-Dashboard — KPI cards: GMV, bookings, accept rate, matching delay, open disputes, KYC pending (numbers + subtle sparklines)
3) Admin-A03-KYC — table pending pros, row click → document viewer (RC Pro PDF/image), actions Approuver / Refuser + reason modal (≥5 chars)
4) Admin-A04-Catalogue — categories/offers/options table, toggles isActive, edit drawer
5) Admin-A05-Zones — list zones Lyon…, map/polygon placeholder, pricing coefficients per offer
6) Admin-A06-Bookings — search by reference/phone, filters status, detail drawer with timeline + Refund button
7) Admin-A07-Litiges — queue, decision buttons: rembourser client / payer pro / partage + notes
8) Admin-A08-Avis — list reviews, Masquer action
9) Admin-A09-Config — form: commission %, cancel free/late hours, matching timeouts T1/T2, feature flags

Use real French labels. Dense tables, filters, confirm modals. Accessibility AA.
```

---

## 7. Prompts E — Section Edit (après génération)

Coller sur l’écran concerné dans UX Pilot (Section Edit / chat) :

**Home client hero**
```
Rewrite Home hero as ONE composition only: brand CarWash, one headline « Lavage à domicile », one subtitle, one primary CTA « Réserver maintenant », one full-bleed car photo background. Remove stats, chips row, and extra cards from the first viewport.
```

**Hors zone**
```
Add a clear error state on Address screen: banner error « Cette adresse n'est pas encore couverte. » + email capture field + CTA « Prévenez-moi » — disable Continuer to payment.
```

**Adresse masquée pro**
```
On New mission cards and pre-accept detail, show neighborhood/quartier only. Reveal full street address only on accepted mission screen.
```

**Gate photos**
```
On Execution screen, disable « Terminer la prestation » until at least 2 before photos and 2 after photos are uploaded; show remaining count.
```

**Paiement sticky**
```
Keep a sticky bottom bar with total TTC and CTA « Payer {amount} » above the home indicator; recap above scrolls.
```

**KYC rejected**
```
Add KYC rejected state: red banner with admin reason, CTA « Corriger et renvoyer », wizard returns to draft steps.
```

**Admin densité**
```
Increase table density, reduce card chrome, use compact filters; this is an ops tool not a consumer landing page.
```

---

## 8. Prompt F — Wireframe rapide (optionnel, avant Hi-fi)

Si tu veux d’abord Wireframe mode :

```
Wireframe mobile French app CarWash client booking flow: Auth OTP → Home → Formula list → Config → Address → Slot → Payment → Tracking timeline. Simple grayscale boxes, labels in French, stepper, sticky CTA. No colors yet.
```

Puis repasse en Hi-fi avec Prompt B + Theme.

---

## 9. Checklist qualité avant export Figma

- [ ] 3 fichiers / boards séparés : Client · Pro · Admin
- [ ] Copy 100 % FR sur boutons et empty states
- [ ] Vert `#0D6E4F` + pas de purple gradient
- [ ] Hero client = 1 composition (règle respectée)
- [ ] Pro : adresse masquée avant accept
- [ ] Photos 2+2 gate visible
- [ ] Admin = densité ops
- [ ] Prototype cliquable Client book + Pro accept
- [ ] Naming frames `Client-C03-Home`, `Pro-P05-Execution`, `Admin-A03-KYC`

---

## 10. Mapping docs internes

| Besoin | Doc |
|--------|-----|
| Écrans détaillés | [cahier-des-charges.md](../cahier-des-charges.md) |
| Personas / copy | [guide-ux-design.md](../guides/guide-ux-design.md) |
| Tokens Figma longs | [spec-figma.md](../spec-figma.md) |
| Wireframes texte | [wireframes.md](../wireframes.md) |
| Règles métier | [regles-de-gestion.md](../regles-de-gestion.md) |

---

## 11. Ordre de génération conseillé (session UX Pilot)

```
Theme hex → Prompt A (contexte)
    → Prompt B Autoflow Client (priorité MVP)
    → Section Edits E (hero, sticky pay, hors zone)
    → Prompt C Autoflow Pro
    → Section Edits (mask address, photo gate)
    → Prompt D Autoflow Admin
    → Prototype + Export Figma
```
