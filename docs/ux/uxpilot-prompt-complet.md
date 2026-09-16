# UX Pilot — Prompt complet CarWash (prêt à coller)

> **Fichier :** un seul prompt détaillé pour la zone de texte UX Pilot.  
> **Marque UI :** **CarWash** (le monorepo reste nommé CARSERVICE en interne).  
> **Ne colle PAS** le README autour — uniquement le bloc entre les lignes `===== COPY FROM HERE =====` et `===== COPY UNTIL HERE =====`.
> **Réglages UX Pilot :** Hi-fi Design · **Mobile** · **Autoflow ON** · Light theme  
> **Astuce :** 1 run = 1 app. Commence par **CLIENT**. Puis nouveau fichier pour PRO, puis ADMIN.

---

===== COPY FROM HERE =====

What I'm building:
A complete multi-screen Hi-fi mobile product FLOW (Autoflow) for CarWash — a modern French marketplace app for eco car washing AT THE CUSTOMER'S HOME (waterless / steam only). Generate a connected booking journey with clear navigation, sticky CTAs, and production-ready UI screens.

Who it's for:
Primary audience for THIS run = CLIENT (car owner). Persona: Claire, 34, lives in Lyon, busy professional, iPhone user, used to Uber/Deliveroo. She wants a clean car without going to a station. She needs trust (verified pro, eco method, fixed price before pay) and speed (book in under 2 minutes).

Platform:
- Mobile iOS/Android, frame 390×844
- Light mode only (no dark default)
- UI language: FRENCH for all labels, buttons, errors, empty states
- Bottom tab bar: Accueil | Réservations | Profil

Product in one sentence:
CarWash = premium-accessible eco car wash at home — « Lavage auto à domicile, éco et assuré ».

Brand & visual style (modern, easy, applicative — 2026):
- Feel: clean, bright, calm, trustworthy, eco — like a premium service app, NOT a discount garage, NOT neon startup, NOT purple AI gradient
- Primary green: #0D6E4F (main CTAs, active steps)
- Primary soft: #E8F5F0 (badges, soft backgrounds)
- Primary dark: #094D38 (pressed states)
- Navy secondary: #1A3A5C (titles / emphasis)
- Accent amber: #F5A623 only for « Populaire » badge
- Neutrals: text #1A1A2E / #4A4A68, borders #D1D1DE, bg #FFFFFF and #F4F4F8
- Success #2E7D4F · Warning #E67E22 · Error #D32F2F
- Typography: calm geometric display for titles + highly readable body (avoid generic Inter-only look)
- Spacing: generous whitespace, 8pt grid, medium radius 8–12 (not pill overload)
- Shadows: soft single layer only
- Home first screen MUST be ONE composition: brand name CarWash + one headline + one short subtitle + one primary CTA + one full-bleed real car/wash photo. No stats strip, no chip cloud, no card collage in the hero.
- Cards only when they are interactive (formula card, booking card)
- Thumb-zone: primary buttons at bottom
- Accessibility: WCAG AA contrast

Business rules that MUST appear in UI:
- Fixed transparent price BEFORE payment (live total on config/payment)
- Verified pro (SIRET + RC Pro + eco) — client sees pro identity AFTER accept
- Card payment pre-auth; capture when job completed
- Status timeline with push-style feedback
- Out of zone = cannot continue to pay; show clear French error + optional email capture
- No free chat, no classic water wash, no B2B, no subscriptions in MVP

French copy to use (verbatim):
- Tagline: Lavage auto à domicile, éco et assuré
- CTA home: Réserver maintenant
- CTA next: Continuer
- CTA pay: Payer {amount}
- Home title: Lavage à domicile
- Home subtitle: Pro certifié, sans eau, chez vous
- Zone OK: Zone couverte · Lyon
- Zone KO: Cette adresse n'est pas encore couverte.
- Status: Recherche d'un professionnel… / Pro confirmé / En route / Lavage en cours / Terminé
- Legal: J'accepte les CGU et la politique de confidentialité
- OTP error: Code incorrect.
- Payment error: Paiement refusé. Vérifiez votre carte.

Generate Autoflow screens IN THIS ORDER (name each screen clearly):

1) Splash — logo CarWash + soft loader on white/#E8F5F0
2) Auth — phone field, « Envoyer le code », 6 OTP digits, CGU checkbox, Continuer
3) Onboarding (skippable) — Prénom, véhicule optionnel, adresse favorite, « Plus tard »
4) Home — ONE hero composition + badge zone + 3 popular formulas (Extérieur express, Complet, Detailing) with « à partir de » prices + optional next booking card
5) Catalogue formules — list with duration, eco badge, price from, tap to select
6) Configuration — type véhicule (citadine / berline / SUV / utilitaire), niveau saleté, options (poils, sièges enfant, jantes…), commentaire, LIVE total TTC + durée, sticky Continuer
7) Adresse & accès — search address, digicode, instructions, map pin, Continuer (show covered state)
8) Créneau — calendar next 14 days + time chips
9) Récap & paiement — summary blocks + sticky footer Payer {amount} + card payment sheet style
10) Confirmation — booking ref like CS-20260916-A1B2 + status Recherche d'un professionnel… + mini timeline
11) Suivi mission — vertical timeline of statuses; after « Pro confirmé » show pro name/rating; address fully visible only after accept
12) Avis — stars 1–5, tags (ponctualité, qualité, propreté), before/after photos, Envoyer
13) Mes réservations — segments À venir / Passées / Annulées with cards
14) Profil — infos, Mes adresses, Paiement, Aide, Supprimer mon compte

Also include these edge screens linked in the flow:
- Address HORS ZONE (error banner + email « Prévenez-moi »)
- Payment refused (retry)
- Empty réservations

Design quality bar:
- Modern, easy to scan, applicative (real fields, real French microcopy, real empty/error states)
- Consistent components: buttons, inputs, badges, stepper, sticky price bar, status pills
- No clutter, no emoji spam, no fake Lorem where French product copy exists
- Make it feel shippable for an Expo React Native MVP

Start generating the full CLIENT Autoflow now.

===== COPY UNTIL HERE =====

---

## Ensuite (nouveaux fichiers UX Pilot)

### Run 2 — PRO (copier tel quel)

```
What I'm building: Hi-fi mobile Autoflow for CarWash PRO app (provider missions + KYC).
Who it's for: Provider Marc, 28, Android, waterless wash auto-entrepreneur who needs missions, guaranteed payout, simple execution.
Platform: Mobile 390×844, light, French UI. Tabs: Missions | Planning | Gains | Profil.
Brand: #0D6E4F + navy #1A3A5C, same modern eco style as client app but more ops-oriented.
Screens: Auth OTP → KYC wizard 7 steps → Missions list (mask full address until accept) → Detail Accept/Refuse → Accepted (full address, GPS, Je suis en route) → Execution checklist + 2 before/2 after photos (CTA disabled until done) → Clôture gains → Planning → Gains Stripe → Profil + RC Pro alert J-30.
Rules: no missions if KYC not approved; neighborhood only before accept; French copy; modern easy applicative UI.
```

### Run 3 — ADMIN (copier tel quel)

```
What I'm building: Hi-fi desktop web Autoflow for CarWash Admin ops console.
Who it's for: Internal ops admin who validates KYC, manages bookings/disputes/catalog/zones in ~30 min/day.
Platform: Desktop 1440, light, French UI. Left nav: Dashboard | Pros KYC | Catalogue | Zones | Bookings | Litiges | Avis | Config.
Style: dense Stripe/Linear-like ops tool — NOT marketing, no hero photos. Brand green #0D6E4F for primary actions.
Screens: Login → Dashboard KPIs → KYC queue + approve/reject reason → Catalogue table → Zones pricing → Bookings search/detail/refund → Disputes resolve → Reviews moderate → Config commission/timeouts.
Modern, clear, applicative data UI with filters, tables, modals.
```

---

## Checklist UX Pilot

1. Nouveau design → Mobile → Hi-fi → Autoflow  
2. Coller le bloc CLIENT (entre les balises)  
3. Theme colors si demandé : `#0D6E4F`  
4. Générer → Section Edit si hero trop chargé  
5. Nouveau fichier pour PRO, puis ADMIN  
6. Export Figma quand satisfait  
