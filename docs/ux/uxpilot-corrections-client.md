# UX Pilot — Corrections Client (crédits limités → handoff dev)

> **Objectif :** 1–2 runs max pour figer le board Client CarWash et commencer Expo (M11).  
> **Réglages :** ouvre ton design Client existant → **Section Edit** / chat sur le canvas (pas un nouveau Autoflow complet).  
> Colle **Prompt 1** en premier. Si crédits OK, **Prompt 2**. Stop.

---

## Prompt 1 — Corrections globales (PRIORITÉ, 1 seul envoi)

```
Refine the EXISTING CarWash CLIENT mobile screens only. Do NOT regenerate a brand-new unrelated app. Keep the current green #0D6E4F / navy layout, French UI, and booking flow. Apply ALL fixes below in one pass:

PRODUCT FIXES
1) Catalog: ensure 4 formulas — Extérieur express, Intérieur, Complet (badge Populaire), Detailing. Each with duration + « À partir de » price + eco badge.
2) Config dirt levels: replace with exactly Léger / Normal / Fort (remove Extrême / Très sale labels).
3) Keep live TOTAL TTC + duration sticky Continuer.
4) Payment screen: keep pré-autorisation copy; CTA « Payer {amount} ».
5) Hors zone screen: keep email capture « Prévenez-moi ».

UX / BRAND FIXES
6) Splash must be FIRST in the flow (before Auth). Logo: replace water-drop icon with a clean car-shine / leaf-eco mark (waterless brand — no water drop).
7) Home: keep full-bleed hero photo + CarWash + « Lavage à domicile » + « Pro certifié, sans eau, chez vous » + CTA « Réserver maintenant » + « Zone couverte · Lyon ». Slightly simplify below hero (max 3 formula rows + next booking). Tabs Accueil | Réservations | Profil.
8) Auth: phone + Envoyer le code + 6 OTP boxes + CGU checkbox + Continuer.
9) Tracking: timeline Recherche d'un professionnel… → Pro confirmé → En route → Lavage en cours → Terminé; show full address only after Pro confirmé.
10) Profile: Mes adresses, Paiement, Aide, Supprimer mon compte.

ADD MISSING STATES (minimal)
11) Réservations empty state: « Aucune réservation » + CTA Réserver maintenant.
12) Auth error: « Code incorrect. »
13) Payment error banner: « Paiement refusé. Vérifiez votre carte. »

DEV HANDOFF
- Keep screen names clear for engineering: Auth, Onboarding, Home, Catalog, Config, Address, Slot, Payment, Confirmation, Tracking, Review, Bookings, Profile, Splash, OutOfZone.
- Consistent components: primary button, inputs, cards, badges, bottom tabs, sticky CTA.
- No new features (no chat, no water wash, no dark mode).
```

---

## Prompt 2 — Polish handoff (seulement si crédit restant)

```
Final polish on CarWash client screens for React Native Expo handoff:
- Unify spacing 8pt, corner radius 12, primary button height ~52
- Same green CTA style on every Continuer / Payer / Réserver
- Status pills consistent colors (pending amber, success green, error red)
- Ensure French microcopy only (no English leftovers)
- Export-ready: clean layers, no overlapping text
Do not change the information architecture.
```

---

## Si UX Pilot demande encore What / Who (court)

```
What I'm building: refine existing CarWash client mobile booking flow screens (Section Edit), not a new product.
Who it's for: client car owners booking eco home car wash (Claire, Lyon).
```

---

## Après export — checklist pour démarrer le DEV (M11)

Tu peux coder dès que tu as Figma/PDF avec :

| Écran | Dev story |
|-------|-----------|
| Splash + Auth OTP | CS-M11-S02 |
| Home + tabs | CS-M11-S03 |
| Catalog → Config → Address → Slot | CS-M11-S04 |
| Payment sticky | CS-M11-S05 |
| Confirmation | CS-M11-S06 |
| Tracking timeline | CS-M11-S07 |
| Review | CS-M11-S08 |
| Bookings list | CS-M11-S09 |
| Profile + delete | CS-M11-S10 |

Tokens à figer en code (`packages/ui-tokens`) :
- primary `#0D6E4F` · primaryDark `#094D38` · navy `#1A3A5C` · accent `#F5A623` · bg `#FFFFFF` / `#F4F4F8` · text `#1A1A2E`

**Ne génère PAS Pro/Admin maintenant** (crédits) — Client suffit pour démarrer le mobile client.
