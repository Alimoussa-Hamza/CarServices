# UX Pilot — CarWash **Pro** (prêt à coller)

> **Ne colle PAS** ce README. Uniquement [`uxpilot-pro-COLLER.txt`](uxpilot-pro-COLLER.txt).  
> What / Who si demandé : [`uxpilot-pro-WHAT.txt`](uxpilot-pro-WHAT.txt) · [`uxpilot-pro-WHO.txt`](uxpilot-pro-WHO.txt)

Prompt **réécrit** d’après la doc UX Pilot 2026 : Context commun, Deep Design, Autoflow à carte fixe, **palette laissée à UX Pilot**, pas Enhance, pas Blitz.

### Réglages dans le fichier (avant Generate)

1. **+ Create New** — pas la home « START GENERATING »
2. Theme Editor : **ne pas forcer nos hex** — laisser l’IA choisir (Light, lisible au soleil)
3. Hi-fi · Mobile 390×844 · Light · **Autoflow ON** · **Deep Design ON**
4. Coller le COLLER · **ne pas** Enhance Prompt
5. Si Autoflow propose des écrans client (Réserver, Accueil) → **les retirer** avant de payer le run
6. Après : **Section Edit** seulement (pas un 2ᵉ Autoflow entier)

---
---

## Le rêve produit (pourquoi ce design)

**CarWash Pro** n’est pas un job board. C’est le **cockpit de terrain** de Marc : un pouce, parking, parfois le soleil, Android milieu de gamme, mains pas propres.

À l’ouverture il doit répondre en 2 secondes :

1. Y a-t-il une mission **maintenant** ?  
2. **Quel bouton** je touche ?  
3. **Combien je gagne net** ?

Même famille **outil** : peu de photos, gros horaires, gros montants, CTA bas. **Couleurs : UX Pilot décide** (une palette Light cohérente, contraste AA).

### Couleur

Laissée au modèle. Une seule palette pour tout le fichier. Pas d’hex imposé.

### Motion

Oui, **uniquement utile** : 200–300 ms, CTA press, stepper KYC, photo qui s’affiche, check de clôture. **Non :** confettis, Lottie en boucle, splash > 1 s, parallax. `prefers-reduced-motion` = statique.

### Principes

| Principe | En UI |
|----------|--------|
| Une action primaire / écran | Accepter énorme ; Refuser en texte |
| Argent = langage pro | « Vous gagnez 77,60 € net » |
| Vie privée client | Quartier avant accept ; rue + digicode + tel après |
| KYC = porte | Pas de file missions tant que `approved` + Connect |
| Preuve métier | Terminer grisé tant que 2+2 photos + checklist |
| Calendrier | Bandeau semaine + chips heures — **pas** un widget mois Google/Apple |
| Carte | Pin simple (KYC base, P04 rue). **Pas** de polygone zone. P03 sans carte immeuble |
| Accessibilité | Contraste AA, 16 px mini, cibles 44 pt, statut ≠ couleur seule |

### Anti-rêve (interdit UX Pilot)

Chat, lavage à l’eau, devis, confettis, gradient violet néon, hero lifestyle, lorem, pie charts, adresse complète avant accept, chrono Uber 8 secondes, calendrier mois, éditeur polygone, turn-by-turn in-app.

### Match client → pro

Le client paie → l’API propose la mission à ~8 pros (**fenêtre de minutes**, premier accept gagne).

| Marc | UI |
|------|-----|
| App fermée | Notif + **1 son court** (si activé) → P03 |
| Sur Missions | Carte en haut + bandeau 4 s |
| En train de laver | Notif système **seulement** |
| Trop tard | « Mission déjà prise » |

---

## Activité — clic → écran ou popup

| Marc tape | Ouvre | Sinon |
|-----------|--------|--------|
| Envoyer / Continuer OTP | P01 | « Code incorrect. » / Continuer grisé si pas CGU |
| Autoriser notifs | Popup OS | Plus tard → P09b plus tard |
| Toggles Sans eau / Vapeur | Reste KYC | Continuer **grisé** si 0 |
| Upload RC Pro | Sheet fichier OS | — |
| Date expiration RC | **Roue native** (pas calendrier mois) | — |
| Adresse KYC | Liste Places + **1 pin** | — |
| Envoyer dossier | Pending | Champ invalide |
| Tap carte / notif / bandeau | P03 | Liste vide → Planning |
| Accepter | Vérification… → P04 | **P03e déjà prise** |
| Refuser | **Sheet motifs** | P02 |
| Copier adresse | Toast 2 s | — |
| Appeler | Sheet téléphone OS | — |
| Ouvrir Maps | App Plans / Google Maps | Pas de nav in-app |
| En route / Arrivé | Même écran puis P05 | — |
| Annuler mission | **Sheet motifs** | Motif obligatoire |
| Case photo | **Sheet caméra / galerie** | Permission → Réglages |
| Terminer | **Modal confirm** | **Grisé** si pas 2+2 + checklist |
| Chip horaire P07 | Toggle bloqué/dispo | Pas un mois calendrier |
| Pause aujourd'hui | **Popup confirm** | — |
| Row Notifications | P09b 4 toggles | Son grisé si Nouvelles off |
| Se déconnecter | **Popup confirm** | — |

Catalogue complet : [uml-activite-actions.md](uml-activite-actions.md). UML : [uml-activite-produit.md](uml-activite-produit.md).

---

## Popups à générer (noms de frames)

| Frame | Type | Depuis |
|-------|------|--------|
| Pro-Pop-OS-Notif | Permission OS | P01-Notif |
| Pro-Pop-OS-Camera | Permission OS | P05 |
| Pro-Pop-OS-Location | Permission OS | KYC pin « ma position » |
| Pro-Pop-Refuser | Bottom sheet radios | P03 |
| Pro-Pop-Annuler | Bottom sheet radios | P04 |
| Pro-Pop-Terminer | Modal | P05 |
| Pro-Pop-PhotoSource | Sheet 2 choix | P05 |
| Pro-Pop-PhotoPreview | Reprendre / Utiliser | P05 |
| Pro-Pop-Pause | Confirm | P07 |
| Pro-Pop-Logout | Confirm | P09 |
| Pro-Ban-NotifOff | Banner | P02 |
| Pro-Ban-Offline | Banner | P02 |
| Pro-Ban-NewMission | Bandeau 4 s | P02 |
| Pro-Lockscreen-NewMission | Notif système | — |
| Pro-P03e-DejaPrise | Plein écran | Accepter trop tard |

---

## Icônes (outline, pas d’emoji)

Bell, BellOff, Camera, MapPin, Navigation2, Phone, Calendar, Wallet, User, List, Clock, Lock, Upload, FileText, Check, WifiOff, Copy, Star, ChevronRight.

Tabs : List · Calendar · Wallet · User. Tel / Maps = ronds 44 pt + libellé.

---

## Coller dans UX Pilot

Ouvre [`uxpilot-pro-COLLER.txt`](uxpilot-pro-COLLER.txt), tout sélectionner, coller dans la zone de prompt.

Après génération : Section Edit si KYC = un seul écran fourre-tout, si les cards montrent l’adresse complète, si P07 ressemble à Google Agenda, si P03 a une carte immeuble.

Quand le flow P00–P09 + popups est utilisable pour coder → dans le chat : **GO M12**.
