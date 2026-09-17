# Cahier M12 — App Pro (CarWash Pro)

> **GO :** 2026-09-17 · **App :** `apps/mobile-provider` · **Maquettes :** [`docs/ux/uxpilot-pro-html-v2/`](../ux/uxpilot-pro-html-v2/)  
> File d’exécution : [`prochaines-taches.md`](prochaines-taches.md) N04→N15 · Stories : `CS-M12-S01`…`S11`  
> **Une story à la fois.** Métier (prix, matching, statuts) = **API uniquement**.

---

## 1. Cadre

| | |
|--|--|
| Produit | App **terrain** Marc (auto-entrepreneur, Lyon). Pas le client, pas l’admin. |
| Plateforme | **Un** layout Expo iOS + Android. Sheets OS natifs = permission notif/caméra, téléphone, Maps. |
| Visuel | Navy & Steel maquettes. **Ne pas** coller le HTML UX Pilot dans Expo. |
| Auth | OTP `role=provider` (même API que le client). |
| Porte | Pas de file missions tant que `kyc === approved` **et** Stripe Connect `charges_enabled`. |
| Mocks | `EXPO_PUBLIC_USE_MOCKS` comme le client. |

**Interdit :** pricing / state-machine booking côté mobile · chat · calendrier mois · lavage à l’eau · nav GPS in-app · FAB Material · 2 apps iOS/Android · confettis · import React UX Pilot.

**Motion (code, pas maquette) :** 200–300 ms utile (press CTA, stepper KYC, photo, check clôture). Splash ≤ 0,8 s. Pas de Lottie en boucle.

---

## 2. Palette (thème app pro — ne pas casser le vert client)

| Token | Hex maquette |
|-------|----------------|
| Primary | `#0B5FA5` |
| Navy texte | `#0B1F33` |
| Surface | `#F5F7FA` |
| Success | `#1B8A5A` |
| Warning | `#B7791E` |
| Error | `#BE3B33` |

`packages/ui-tokens` reste le vert **client**. Overlay local dans `apps/mobile-provider/src/theme`.

UI FR · cibles ≥ 44 pt · CTA sticky ≥ 52 pt · body ≥ 16 · titres ≥ 22 · statut = icône + texte.

---

## 3. Carte maquette → route Expo

| Fichier HTML | Écran | Route (cible) | Story |
|--------------|-------|---------------|-------|
| 01 Splash | P00 splash | `app/index.tsx` | S01 |
| 02 Auth | P00 phone+OTP+CGU | `app/(auth)/login.tsx` | S02 |
| 03 Notif + 04 OS Notif | Permission | après OTP / avant KYC | S02/S11 |
| 05–11 KYC 1–7 | P01a–g | `app/(kyc)/[step].tsx` | S03 |
| 12 Pending | dossier 48 h | `app/(kyc)/pending.tsx` | S03 |
| 13 Rejected | motif + corriger | `app/(kyc)/rejected.tsx` | S03 |
| 14 Connect | Activer les virements (pas Skip) | `app/(kyc)/connect.tsx` | S10 |
| 15 Missions | P02 3 onglets | `app/(tabs)/missions.tsx` | S04 |
| 16 Détail | P03 quartier + net | `app/missions/[id].tsx` | S05 |
| 17 Déjà prise | P03e | même stack | S05 |
| 18 Lockscreen | mock notif | pas une route app | S11 |
| 19 Acceptée | P04 Maps + en route | `app/missions/[id]/active.tsx` | S06 |
| 20 Exécution | P05 2+2 | `app/missions/[id]/execute.tsx` | S07 |
| 21 Clôture | P06 | `app/missions/[id]/done.tsx` | S07 |
| 22 Planning | P07 | `app/(tabs)/planning.tsx` | S09 |
| 23 Gains | P08 | `app/(tabs)/gains.tsx` | S08 |
| 24 Profil | P09 | `app/(tabs)/profil.tsx` | S03+/S08 |
| 25 Notifs | P09b | `app/profil/notifs.tsx` | S11 |
| 26–33 Popups | sheets | composants | au fil des stories |

**Tabs bas (après porte KYC+Connect seulement) :** Missions \| Planning \| Gains \| Profil.

Popups : OS Notif, OS Camera, Refuser (radios), Annuler (motif requis, CTA grisé), Terminer confirm, PhotoSource, PhotoPreview, Pause, Logout.

---

## 4. File d’exécution (ordre bloquant)

```
S01 Setup  →  S02 Auth  →  S03 KYC  →  S10 Connect
    →  S04 Liste  →  S05 Accept  →  S06 En route  →  S07 Photos/clôture
    →  S09 Planning  →  S08 Gains  →  S11 Push  →  Gate N15
```

Connect **avant** la file missions (un accept sans payout = dette).

---

## 5. Stories détaillées

### N04 · CS-M12-S01 — Setup Expo Router + tabs `[x]`

**But :** socle identique au client (Expo 52, Router, tokens, mocks, tests).

- [x] `main`: `expo-router/entry` · port **8082**
- [x] Stack + tabs FR Missions / Planning / Gains / Profil
- [x] Thème Navy & Steel (overlay local)
- [x] `initApiClient` + `EXPO_PUBLIC_USE_MOCKS` + `EXPO_PUBLIC_API_URL`
- [x] Splash P00 (wordmark CarWash Pro, pas de photo)
- [x] Jest + typecheck
- [x] Tabs **visibles en S01** (placeholders) ; **S02/S03** les cachent tant que porte fermée

**Hors S01 :** OTP, KYC, Maps, Stripe, push.

---

### N05 · CS-M12-S02 — Auth P00 `[x]`

**API :** `POST /auth/otp/send` · `POST /auth/otp/verify` (`role=provider`) · `GET /auth/me` · refresh/logout.

- [x] Téléphone +33, **Envoyer le code**
- [x] 6 OTP, **Continuer** grisé si CGU off
- [x] Erreur **Code incorrect.**
- [x] Session SecureStore
- [x] Non connecté → auth ; connecté KYC ≠ approved → wizard (pas tabs)
- [x] Tests send/verify/erreur + persist

---

### N06 · CS-M12-S03 — KYC P01 (7 écrans)

**API :** `GET/PATCH /providers/me` · `POST /providers/kyc/submit` · `GET /providers/kyc/status` · `GET /providers/kyc/alerts` · `GET /providers/missions/eligibility` · `PUT` capabilities / availability / zones · upload presign (mock S3 OK).

| Step | Maquette | Champs | CTA grisé si |
|------|----------|--------|----------------|
| 1/7 | Société | raison sociale, SIRET 14 | invalide |
| 2/7 | RC Pro | PDF/JPG + **roue date** (pas mois) | pas de fichier / date |
| 3/7 | Méthodes | **Sans eau / Vapeur** seulement (min 1) | 0 on |
| 4/7 | Zone | Places + **1 pin + rayon** (pas polygone) | pas d’adresse |
| 5/7 | Formules | Extérieur / Intérieur / Complet / Detailing — **sans prix** | 0 check |
| 6/7 | Dispo | chips Lun–Dim + heures | — |
| 7/7 | Photo+bio | caméra portrait → **Envoyer mon dossier** | — |

Puis Pending (pas de tabs, 48 h, Voir/Actualiser) · Rejected (RC illisible, **Corriger et renvoyer**).

**RG-KYC :** missions lock si pas `approved`.

- [x] Wizard `/(kyc)/wizard/1`–`7` + pending/rejected

---

### N07 · CS-M12-S10 — Stripe Connect

**API :** `POST /providers/stripe/onboard` · statut `charges_enabled`.

- [x] Écran **Activer les virements** — **pas de Skip**
- [x] Account Link via `expo-web-browser` (page Stripe, pas nous)
- [x] Retour app → re-fetch eligibility
- [x] Sans Connect → pas de P02

---

### N08 · CS-M12-S04 — Liste P02

**API :** `GET /bookings/available` · `GET /bookings` (filtres).

Onglets **Nouvelles | À venir | En cours**. Carte : horaire gros, **quartier seul**, formule, km, **net**. Pin « Mission en cours » si `in_progress`. Empty : *Aucune mission pour le moment.*

Bandeaux : offline · notifs off · toast 4 s nouvelle mission (**jamais** plein écran si P04/P05). Pull-to-refresh. Toggle pause (ouvre sheet Pause).

- [x] 3 onglets + empty + net/quartier + pause

---

### N09 · CS-M12-S05 — Détail P03 + refuse

**API :** `GET /bookings/:id` · `POST .../accept` · `POST .../decline`.

- [x] Hero **Vous gagnez 77,60 € net** (montant API)
- [x] Quartier + *Adresse exacte après acceptation* — **zéro carte immeuble**
- [x] Helper : *Plusieurs pros voient cette mission. Le premier qui accepte la prend.*
- [x] Accepter → **Vérification…** → P04 ou P03e
- [x] **Pas** de chrono 8 s Uber
- [x] Sheet Refuser (radios + confirmer)

---

### N10 · CS-M12-S06 — En route P04

**API :** `PATCH /bookings/:id/status` `en_route` \| `in_progress` · cancel + motif.

- [x] Carte ~40 % **un** pin, adresse complète **après** accept, copier, tel ≥ 44 pt
- [x] **Ouvrir Maps** = `Linking` système (pas turn-by-turn in-app)
- [x] Un sticky CTA : **Je suis en route** → **Je suis arrivé**
- [x] Annuler → sheet motif obligatoire (CTA grisé tant que vide)
- [ ] `react-native-maps` + `expo-location` si besoin → **dev client EAS** (comme Stripe)
- [x] Géofence 200 m = **API**, pas inventée mobile

---

### N11 · CS-M12-S07 — Exécution P05 + clôture P06

**API :** upload photos · checklist · `PATCH .../status` `completed` (capture **côté API**).

- [x] Compteurs **Avant n/2** · **Après n/2** (min 2+2, RG-BOOK-04)
- [x] Checklist offre
- [x] **Terminer la prestation** grisé + helper tant que KO
- [x] Sheets : caméra OS, source, preview, confirm
- [x] P06 : check, gros net, **Voir mes gains** (pas confettis)

---

### N12 · CS-M12-S09 — Planning P07

**API :** `GET/PUT /providers/availability`.

- [x] Semaine Lun–Dim + chips heures (jamais grille mois)
- [x] Accent = dispo, gris = bloqué
- [x] **Pause aujourd’hui** → sheet 1 h / aujourd’hui / manuel
- [x] Pas de bouton + Material

---

### N13 · CS-M12-S08 — Gains P08

**API :** payouts Connect / bookings completed (affichage, pas de calcul commission).

- [x] Hero **Solde en transit** (pas « disponible cash »)
- [x] Liste versé / en attente — **pas de camembert**
- [x] Lien depuis P06 et tab Gains

---

### N14 · CS-M12-S11 — Push

**API :** register token Expo · events déjà envoyés (M09).

- [x] Permission Autoriser / Plus tard
- [x] Tap notif → P03 ; si P04/P05 → système only
- [x] P09b : Nouvelles missions · Son (grisé si Nouvelles off) · Rappels H-1 · Compte
- [x] 1 ping court si Son on · mock si pas `EXPO_ACCESS_TOKEN`
- [x] Profil : badge **RC Pro · expire dans 30 j** (`/providers/kyc/alerts`)

---

### N15 — Gate M12

- [x] Golden path e2e : pré-auth → accept → 2+2 → `captured` 20 % → admin
- [x] P0 photos : `BOOKING_PHOTOS_REQUIRED`
- [x] `apps/api/test/e2e/m12-provider.e2e-spec.ts` + pyramide unit + build mobile-provider

**Commit gate avant EAS (N16).** Smoke Expo pro = test humain (pas d’EAS tant que tu n’as pas validé).

---

## 6. États sans maquette dédiée (à coder sur les écrans existants)

OTP seul · Continuer grisé · listes vides À venir / En cours · pull-to-refresh · erreur réseau · page Stripe externe · CGU texte · ré-édition KYC depuis Profil · facture · supprimer photo · client annule · RC expirée · lock KYC.

---

## 7. Hors M12 (volontaire)

Admin · app client · chat · éditeur polygone · reassign · litige UI Marc · EAS/stores (M14) · Twilio FR prod.

---

## 8. Tests mini par story

| Story | Tests |
|-------|--------|
| S01 | env mocks, tabs FR, thème navy ≠ vert client, typecheck |
| S02 | OTP ok / KO / CGU |
| S03 | 7 steps validation, submit, pending lock |
| S10 | pas de Skip, eligibility |
| S04 | quartier only, 3 tabs, empty |
| S05 | accept/refuse, déjà prise, pas d’adresse avant |
| S06 | status API, Linking Maps |
| S07 | Terminer disabled 2+2 |
| S08 | solde transit, pas de chart |
| S09 | chips semaine |
| S11 | toggle Son dépend Nouvelles |
| Gate | e2e m12 + pyramide |

---

## 9. Références

- Maquettes v2 HTML : `docs/ux/uxpilot-pro-html-v2/`
- Brief : `docs/ux/uxpilot-pro-COLLER.txt`
- Actions Marc : `docs/ux/uml-activite-actions.md`
- RG : `docs/regles-de-gestion.md` (KYC, BOOK-04, MATCH, PAY, CANCEL)
- Contrat : `docs/api-contrat-v1.md` (`/providers/*`, `/bookings/*`)
- Guide : `docs/guides/guide-mobile-pro.md`
- Versions : Expo **52** · RN **0.76** · Node **20** (`docs/tech-stack/versions.md`)
