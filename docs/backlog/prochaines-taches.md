# Prochaines tâches — post M13 (file unique)

> **Une seule tâche à la fois.** Dis « ok » pour exécuter la suivante **codable**.  
> Les tâches `humain` : tu les fais ; l’IA prépare le brief / vérifie le GO.  
> Origine : M11 client ✅ · M13 admin ✅ · **trou produit = app pro (M12 0/11)**.

**Légende :** `[x]` fait · `[~]` en cours · `[ ]` à faire · `[!]` bloqué · `humain` / `ia`

**Règle architecte :** métier (prix, statuts, matching) **uniquement API**. Mobile = affichage + appels. Pas d’EAS/stores avant gate M12. Pas de polish admin (A08, carte zones, 2FA) dans cette file.

---

## Ordre d’exécution

| # | ID | Tâche | Owner | Dépend | Statut |
|---|-----|--------|-------|--------|--------|
| 1 | **N01** | Smoke manuel client Expo (OTP → booking DB) | humain | API :3000 | `[ ]` |
| 2 | **N02** | Brief UX Pilot **pro** prêt à coller | ia | — | `[x]` |
| 3 | **N03** | Maquettes M12 générées + GO collé | humain | N02 | `[x]` |
| 4 | **N04** | CS-M12-S01 Setup Expo Router pro + tabs | ia | N03 GO | `[x]` |
| 5 | **N05** | CS-M12-S02 Auth P00 OTP | ia | N04 | `[x]` |
| 6 | **N06** | CS-M12-S03 KYC wizard P01 (7 steps) | ia | N05 | `[x]` |
| 7 | **N07** | CS-M12-S10 Stripe Connect onboarding | ia | N06 | `[x]` |
| 8 | **N08** | CS-M12-S04 P02 Liste missions (3 tabs) | ia | N07 | `[x]` |
| 9 | **N09** | CS-M12-S05 P03 Détail accept / refuse | ia | N08 | `[x]` |
| 10 | **N10** | CS-M12-S06 P04 En route + Maps + tel | ia | N09 | `[x]` |
| 11 | **N11** | CS-M12-S07 P05 Checklist + photos 2+2 | ia | N10 | `[ ]` |
| 12 | **N12** | CS-M12-S09 P07 Planning disponibilités | ia | N11 | `[ ]` |
| 13 | **N13** | CS-M12-S08 P08 Gains | ia | N12 | `[ ]` |
| 14 | **N14** | CS-M12-S11 Push nouvelle mission | ia | N13 | `[ ]` |
| 15 | **N15** | Gate M12 — golden path client→pro→capture | ia+humain | N14 | `[ ]` |
| 16 | **N16** | M14-S03 EAS preview TestFlight + APK | humain+ia | N15 | `[ ]` |
| 17 | **N17** | M14-S02 SC-01…06 manuels staging | humain | N16 | `[ ]` |
| 18 | **N18** | M14-S04/S05 prod + stores | humain | N17 | `[ ]` |

**Hors file (volontaire) :** A08 avis admin · éditeur carte zones · reassign booking · Twilio FR · Sentry mobile · 2FA admin.

**Cahier M12 (détail écrans/API/tests) :** [`m12-cahier.md`](m12-cahier.md)  
**Maquettes v2 :** [`docs/ux/uxpilot-pro-html-v2/`](../ux/uxpilot-pro-html-v2/)

**En cours :** prochaine = **N11** Exécution P05 (dis « ok »).

---

## N01 — Smoke manuel client (humain)

**But :** le parcours Claire existe vraiment sur téléphone, pas seulement le script GATE-03.

### Checklist

- [ ] Expo client restart (`EXPO_PUBLIC_USE_MOCKS=false`)
- [ ] OTP (log API si Twilio off)
- [ ] Adresse Lyon → slots → Stripe test → référence `CS-…` en admin `/bookings`
- [ ] Noter 3 bugs max (P0 seulement)

**Done :** une ligne dans le journal ci-dessous « N01 GO » ou « N01 KO + symptôme ».

---

## N02 — Brief UX pro (ia) ✅

Fichier à coller dans UX Pilot (nouveau fichier, **pas** le flow client) :

[`docs/ux/uxpilot-pro-COLLER.txt`](../ux/uxpilot-pro-COLLER.txt)  
Guide : [`docs/ux/uxpilot-prompt-pro.md`](../ux/uxpilot-prompt-pro.md)

Réglages : Hi-fi · Mobile · Autoflow ON · 390×844 · light · FR.

---

## N03 — Maquettes M12 + GO (humain) `[!]`

**But :** un Autoflow P00–P09 assez bon pour coder sans inventer d’écrans.

### Checklist

- [x] Nouveau fichier UX Pilot (ne pas éditer le client)
- [x] Coller `uxpilot-pro-COLLER.txt` → générer + 10 Section Edit
- [x] Vérifier : 7 steps KYC, adresse masquée avant accept, 2+2 photos, « Vous gagnez {net} »
- [x] Export HTML v2 dans `docs/ux/uxpilot-pro-html-v2/`
- [x] GO M12 2026-09-17

**Done :** GO explicite. Cahier : [`m12-cahier.md`](m12-cahier.md).

---

## N04 — CS-M12-S01 Setup pro

**But :** `apps/mobile-provider` = Expo Router, tokens, tabs Missions | Planning | Gains | Profil, branche API (mocks flag comme le client).

### Checklist

- [x] Router + tabs FR
- [x] `initApiClient` + `EXPO_PUBLIC_USE_MOCKS`
- [x] Tests smoke écran + typecheck
- [ ] Commit `feat(mobile-provider): …` (dis « commit » si tu veux)

---

## N05 — CS-M12-S02 Auth P00

**But :** OTP rôle `provider` (même API que le client, `role=provider`).

### Checklist

- [x] Phone + code 6 + CGU
- [x] Session persistée
- [x] KYC non approved → wizard, pas missions
- [x] Tests (23) + typecheck

---

## N06 — CS-M12-S03 KYC P01

**But :** wizard 7 steps, submit, écran pending. Missions bloquées tant que `kyc !== approved` (RG-KYC).

| Step | Contenu |
|------|---------|
| 1 | Société, SIRET, IBAN |
| 2 | Upload RC Pro + expiry |
| 3 | Méthodes waterless / steam (min 1) |
| 4 | Zone + adresse de base |
| 5 | Capabilities formules |
| 6 | Dispo hebdo |
| 7 | Photo + bio → submit |

S3 peut rester mock local si pas de bucket.

### Checklist

- [x] 7 steps + Continuer grisé
- [x] Submit → pending, tabs lock (RG-KYC)
- [x] Rejected → Corriger mon dossier
- [x] Tests + typecheck

---

## N07 — CS-M12-S10 Stripe Connect

**But :** onboarding in-app jusqu’à `charges_enabled`. Sans ça, payout cassé.

Ordre **avant** la file missions : un pro qui accepte sans Connect = dette paiement.

### Checklist

- [x] Activer les virements — pas de Skip
- [x] Account Link `expo-web-browser`
- [x] Retour → eligibility / `chargesEnabled`
- [x] Tests + typecheck

---

## N08 — CS-M12-S04 Liste missions P02

Tabs **Nouvelles | À venir | En cours**. Carte : créneau, **quartier seul**, formule, **net pro**, distance. Empty KYC pending.

### Checklist

- [x] 3 onglets + empty
- [x] Quartier (zone), net (split partagé), pas de rue
- [x] Pause sheet + pull-to-refresh + toast 4 s
- [x] Tests + typecheck

---

## N09 — CS-M12-S05 Détail + accept/refuse P03

CTAs Accepter / Refuser. Après accept : adresse complète. Logique transition = API.

### Checklist

- [x] Hero net, quartier, pas de rue avant accept
- [x] Helper premier qui accepte + pas de chrono 8 s
- [x] Sheet refus + P03e déjà prise
- [x] Tests + typecheck

---

## N10 — CS-M12-S06 En route P04

Maps + tel client. « Je suis en route » / « Je suis arrivé ». Géofence optionnelle (API).

---

## N11 — CS-M12-S07 Exécution P05

Checklist + **2 photos avant + 2 après**. CTA Terminer disabled sinon (RG-BOOK-04). Clôture → capture côté API.

---

## N12 — CS-M12-S09 Planning P07

Créneaux dispo = ce que le client voit au booking.

---

## N13 — CS-M12-S08 Gains P08

Solde en transit + historique payouts Connect.

---

## N14 — CS-M12-S11 Push mission

Token Expo + notif « Nouvelle mission » (high). Mock local si pas `EXPO_ACCESS_TOKEN`.

---

## N15 — Gate M12 (pyramide + golden path)

**Critère unique de « ça marche » :**

1. Client réserve (pre-auth)  
2. Pro KYC+Connect accepte dans l’app  
3. Photos 2+2 + clôture  
4. Payment `captured`, commission 20 %  
5. Booking visible admin  

+ `m12-*.e2e-spec.ts` + `pnpm test` / build mobile-provider. **Commit gate avant N16.**

---

## N16–N18 — Launch (M14)

Uniquement après N15 vert. EAS preview → SC manuels staging → stores. Twilio FR et Places : clés staging ici, pas avant.

---

## Comment exécuter

| Qui dit ça | Effet |
|------------|--------|
| « ok » | IA code la **prochaine** tâche `ia` débloquée |
| « GO M12 » | N03 = `[x]` → N04 autorisé |
| « N01 GO » | smoke client noté |

---

## Journal d’exécution

| Date | Tâche | Notes |
|------|-------|-------|
| 2026-09-17 | File N01–N18 créée | M13 8/8 fermé · N02 brief pro écrit |
| 2026-09-17 | N02 done | `docs/ux/uxpilot-pro-COLLER.txt` |
| 2026-09-17 | N03 GO M12 | maquettes v2 + [`m12-cahier.md`](m12-cahier.md) · N04 ouvert |
| 2026-09-17 | N04 done | Expo Router + tabs FR + thème Navy · 7 tests |
| 2026-09-17 | N05 done | OTP provider + gate KYC · 23 tests |
| 2026-09-17 | N06 done | KYC wizard 7 steps · mock pending |
| 2026-09-17 | N07 done | Stripe Connect onboarding, pas de Skip |
| 2026-09-17 | N08 done | P02 liste missions 3 onglets |
| 2026-09-17 | N09 done | P03 accept/refuse, pas de chrono 8 s |
| 2026-09-17 | N10 done | P04 En route Maps Linking + tel · géofence API |

### Historique file précédente (post-M11, close)

T01 GATE-03 · T02–T04f M13 S01–S08 — tous `[x]` (commits `710d1f2` … `f9d614e`).
