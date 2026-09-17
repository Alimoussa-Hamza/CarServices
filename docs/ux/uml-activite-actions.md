# Toutes les actions utilisateur (produit)

> Cahier + wireframes + RG-NOTIF. **Pas** le code.  
> **FAIT** = déjà dans une app · **A FAIRE** = pas encore.  
> UML : [uml-activite-produit.md](uml-activite-produit.md) §6–7.

Hors MVP (non listé) : chat, devis, flottes, multi-pays.

---

## Claire

| Écran | Action | Si on / succès | Si off / échec | Produit |
|-------|--------|----------------|----------------|---------|
| C00 | Ouvre l’app | Home si session, sinon Auth | Flag wash off → Bientôt | FAIT · flag A FAIRE |
| C01 | Envoyer le code | Champ OTP | Erreur / rate limit | FAIT |
| C01 | Renvoyer le code | Nouveau SMS | Rate limit | FAIT |
| C01 | Saisir OTP + CGU + Continuer | Home / C02 | Code incorrect. | FAIT |
| C02 | Prénom / véhicule / adresse | Home | — | A FAIRE |
| C02 | Plus tard | Home | — | A FAIRE |
| OS | Autoriser notifs | Token Expo | Plus tard / réglages | FAIT (C13 bouton) |
| C03 | Tab Accueil / Réservations / Profil | Écran | — | FAIT |
| C03 | Réserver maintenant | C04 | Flag wash : CTA off | FAIT |
| C03 | Card formule populaire | C05 pré-sélection | — | FAIT |
| C03 | Badge zone | Modal zone | — | A FAIRE |
| C03 | Prochaine résa / Voir suivi | C10 | Section vide | FAIT |
| C04 | Choisir formule | C05 | Offre inactive invisible | FAIT |
| C04 | Retour | C03 | — | FAIT |
| C05 | Radio véhicule | Prix live | — | FAIT |
| C05 | Radio saleté | Prix live ; Fort peut cacher Express | — | FAIT |
| C05 | **Toggle option** on/off | +/− `price_delta` + durée | Option admin off = absente | FAIT |
| C05 | Commentaire 300 car. | Draft | — | A FAIRE |
| C05 | Photos préalable 0–5 | Caméra / galerie | Permission KO | A FAIRE |
| C05 | Continuer | C06 | Grisé tant que quote KO | FAIT |
| C06 | Autocomplete Places | Pin | Mock / clé absente | FAIT |
| C06 | Utiliser ma position | Pin GPS | Consentement refusé | A FAIRE |
| C06 | Déplacer le pin | Recalc zone | — | A FAIRE |
| C06 | Digicode / instructions | Draft | — | FAIT |
| C06 | Adresse enregistrée | Préremplit | — | FAIT |
| C06 | + Ajouter une adresse | CRUD | — | FAIT |
| C06 | Continuer | C07 | **Grisé hors zone** | FAIT |
| C06 | Me prévenir (lead) | Toast | Email invalide | FAIT |
| C07 | Jour calendrier | Slots du jour | Jours passés grisés | FAIT |
| C07 | Créneau | Sélection unique | Complet / < H+2 grisé | FAIT |
| C07 | Continuer | C08 | Grisé sans slot | FAIT |
| C08 | Modifier une étape | C05/C06/C07 | — | A FAIRE |
| C08 | Changer de carte | Sheet Stripe | — | A FAIRE |
| C08 | Cocher CGV | Payer actif | **Payer grisé** | A FAIRE |
| C08 | Payer | C09 | Paiement refusé / Réessayer | FAIT |
| C09 | Recevoir push + email récap | — | Twilio/Brevo off = log | FAIT API |
| C09 | Suivre ma réservation | C10 | — | FAIT |
| C09 | Retour accueil | C03 | — | FAIT |
| C10 | Tap notif statut | C10 | App tuée : cold start | FAIT |
| C10 | Annuler | Annulé RG-CANCEL | Après en cours → litige | FAIT |
| C10 | Appeler le pro | Tel | Avant accept : masqué | A FAIRE |
| C10 | Signaler un problème | C14 / litige | Fenêtre 48 h | A FAIRE |
| C10 | Unassigned : autre créneau | C07 | — | A FAIRE |
| C10 | Unassigned : remboursement | Refund | Déjà remboursé | A FAIRE |
| C11 | Note 1–5 + tags + commentaire | Envoyé | Hors 72 h fermé | FAIT |
| C11 | Plus tard | C12 | — | FAIT |
| C11 | Voir photos avant/après | Galerie | — | A FAIRE |
| C12 | Segments À venir / Passées / Annulées | Liste | Vide | FAIT |
| C12 | Ouvrir une ligne | C10 / C11 | — | FAIT |
| C13 | Modifier mes infos | Sauvé | Validation | FAIT |
| C13 | Mes adresses CRUD | Liste | — | FAIT |
| C13 | Activer les notifications | Push on | Simulateur / refus OS | FAIT |
| C13 | Toggles Push / SMS / email | Canal off = silence | — | A FAIRE |
| C13 | Moyens de paiement | Portal Stripe | — | A FAIRE |
| C13 | Aide | mailto | C14 in-app | A FAIRE in-app |
| C13 | Lire CGU | Web | — | FAIT |
| C13 | Se déconnecter | Auth | — | FAIT |
| C13 | Supprimer mon compte | Anonymisé RGPD | — | FAIT |
| C14 | FAQ | Article | — | A FAIRE |
| C14 | Ouvrir litige + motif + photos | Payout gelé | Hors 48 h | A FAIRE |

---

## Marc (tout A FAIRE sauf canaux API)

| Écran | Action | Si on / succès | Si off / échec | Produit |
|-------|--------|----------------|----------------|---------|
| P00 | OTP + CGU | P01 | Code incorrect. | A FAIRE |
| P01b | Autoriser notifs | Suite KYC | Plus tard / réglages | A FAIRE |
| P01 | 7 × Continuer | Étape suivante | Champ invalide | A FAIRE |
| P01 | Toggle Sans eau / Vapeur | Min 1 | **Continuer grisé** si 0 | A FAIRE |
| P01 | Upload RC Pro + date | Fichier | Type / taille | A FAIRE |
| P01 | Toggles formules (capabilities) | Matching filtré | Aucune = 0 mission | A FAIRE |
| P01 | Dispo hebdo | Créneaux match | — | A FAIRE |
| P01 | Photo + bio | Dossier | — | A FAIRE |
| P01 | Envoyer mon dossier | Pending | — | A FAIRE |
| P01 | Voir / Corriger dossier | Wizard | — | A FAIRE |
| Connect | Activer les virements | charges_enabled | Incomplet | A FAIRE |
| P02 | Tabs Nouvelles / À venir / En cours | Liste | KYC lock | A FAIRE |
| P02 | Pull-to-refresh | Maj | Réseau | A FAIRE |
| P02 | Activer les notifications (vide) | OS | — | A FAIRE |
| P02 | Tap carte | P03 | — | A FAIRE |
| P02 | Tap notif lock screen | P03 + son si toggle | Son off | A FAIRE |
| P02 | Bandeau in-app 4 s | P03 | En job : pas de plein écran | A FAIRE |
| P03 | Accepter | P04 lock | Déjà prise | A FAIRE |
| P03 | Refuser + motif | P02 | — | A FAIRE |
| P04 | Copier adresse | Clipboard | Avant accept : masquée | A FAIRE |
| P04 | Appeler le client | Tel | — | A FAIRE |
| P04 | Ouvrir Maps | GPS | — | A FAIRE |
| P04 | Je suis en route | Push Claire | — | A FAIRE |
| P04 | Je suis arrivé | P05 | Géofence 200 m optionnelle | A FAIRE |
| P04 | Annuler + motif | Pénalité RG-CANCEL | Motif obligatoire | A FAIRE |
| P05 | Cocher checklist | Item on/off | Obligatoires pour Terminer | A FAIRE |
| P05 | Caméra avant/après | Miniature | Permission → réglages | A FAIRE |
| P05 | Supprimer une photo | Compteur −1 | Min 2+2 | A FAIRE |
| P05 | Note interne | Draft | — | A FAIRE |
| P05 | Terminer | Modal confirm | **Grisé** si 2+2 ou checklist KO | A FAIRE |
| P06 | Voir mes gains | P08 | — | A FAIRE |
| P07 | Bloquer un créneau | Indispo matching | — | A FAIRE |
| P07 | Pause ponctuelle on/off | 0 nouvelle | Off = eligible | A FAIRE |
| P08 | Voir solde / virements / factures | Liste | — | A FAIRE |
| P09 | Toggles formules / zones | Capabilities | — | A FAIRE |
| P09 | Re-upload RC Pro | Alerte J-30 off | Expiré = lock | A FAIRE |
| P09b | Toggle Nouvelles missions | Push mission | Silence missions | A FAIRE |
| P09b | Toggle Son | 1 ping | Muet (DND respecté) | A FAIRE |
| P09b | Toggle Rappels H-1 | Push H-1 | Pas de rappel | A FAIRE |
| P09b | Toggle Compte | KYC / RC | Silence compte | A FAIRE |
| P09 | Déconnexion | Auth | — | A FAIRE |

---

## Ops

| Écran | Action | Si on / succès | Si off / échec | Produit |
|-------|--------|----------------|----------------|---------|
| A01 | Connexion | Dashboard | Mauvais mdp | FAIT |
| A01 | 2FA | Session | Code faux | A FAIRE |
| A01 | Déconnexion | Login | — | FAIT |
| A02 | Lire KPIs / période | Graph | — | FAIT |
| A03 | Filtrer file KYC | Table | — | FAIT |
| A03 | Ouvrir docs | Viewer | — | FAIT |
| A03 | Approuver | Pro eligible + notif | — | FAIT |
| A03 | Refuser + motif ≥ 5 | Pro corrige + notif | Motif trop court | FAIT |
| A04 | CRUD catégorie | Liste | — | FAIT |
| A04 | **Activer / Désactiver** catégorie | `isEnabled` → C03/C04 | Flag wash | FAIT |
| A04 | CRUD offre | Drawer | — | FAIT |
| A04 | **Activer / Désactiver** offre | Invisible book, histo OK | — | FAIT |
| A04 | CRUD option + **On / Off** | Absente C05 si off | — | FAIT |
| A05 | Coeff / clone / horaires | Sauvé | Hors bornes | FAIT |
| A05 | **Activer / Désactiver** zone | Hors zone client | — | FAIT |
| A05 | Éditer polygone carte | GeoJSON | — | A FAIRE |
| A06 | Recherche / filtres | Détail | — | FAIT |
| A06 | Rembourser | Annulé admin | Non remboursable | FAIT |
| A06 | Reassign pro | Nouveau pro | — | A FAIRE |
| A06 | Force cancel | Annulé | — | A FAIRE |
| A07 | 3 décisions + notes | Tranché | Split sans notes | FAIT |
| A08 | Masquer avis | Note recalculée | — | A FAIRE |
| A08 | Ban temporaire | Lock matching | — | A FAIRE |
| A09 | Sauver commission / T1 / T2 / annulation | Config | Hors bornes | FAIT |
| A09 | **Feature flag wash** | Home sans CTA | — | A FAIRE |

---

## Événements notif (plateforme → user)

| Événement | Qui | Canal | Tap | Produit envoi | Produit UI |
|-----------|-----|-------|-----|---------------|------------|
| Paiement OK | Claire | Push + email | C09 | FAIT | FAIT push client |
| Pro trouvé | Claire | Push + SMS | C10 | FAIT | FAIT |
| En route | Claire | Push | C10 | FAIT | FAIT |
| Terminé | Claire | Push | C11 | FAIT | FAIT |
| Unassigned | Claire | Push | C10 | FAIT | FAIT |
| Annulation | Claire + Marc | Push | Détail | FAIT | Marc A FAIRE |
| Nouvelle mission | Marc | Push + SMS + **1 son** | P03 | FAIT API | **A FAIRE** app |
| Rappel H-1 | Marc | Push | P04 | FAIT API | A FAIRE |
| KYC approuvé/rejeté | Marc | Push + email | P01 | FAIT API | A FAIRE |
| RC Pro J-30 | Marc | Push + email | P09 | FAIT API | A FAIRE |
