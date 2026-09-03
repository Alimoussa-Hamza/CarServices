# Wireframes textuels — CARSERVICE MVP

> **Version :** 1.0  
> **Écrans couverts :** Client C03–C10, Pro P02–P05  
> **Format :** Mobile-first (375 × 812 px, iPhone standard)  
> **Convention :** `[Bouton]` = action tap | `(•)` = sélection | `───` = séparateur

---

## Conventions globales

### Navigation client
```
┌─────────────────────────────────────┐
│ ← Retour              CARSERVICE  ☰ │  ← Header sticky
├─────────────────────────────────────┤
│                                     │
│           CONTENU ÉCRAN             │
│                                     │
├─────────────────────────────────────┤
│  🏠 Accueil   📋 Réservations  👤  │  ← Tab bar (sauf parcours réservation)
└─────────────────────────────────────┘
```

### Navigation pro
```
┌─────────────────────────────────────┐
│ ← Retour              Missions    ⚙ │
├─────────────────────────────────────┤
│                                     │
│           CONTENU ÉCRAN             │
│                                     │
├─────────────────────────────────────┤
│  📋 Missions   📅 Planning   💰    │
└─────────────────────────────────────┘
```

### Barre de progression réservation (C04–C08)
```
Étape 1 ●───○───○───○───○   Formule
Étape 2 ○───●───○───○───○   Config
Étape 3 ○───○───●───○───○   Adresse
Étape 4 ○───○───○───●───○   Créneau
Étape 5 ○───○───○───○───●   Paiement
```

---

# PARTIE CLIENT

---

## C03 — Home Client

**Objectif :** Point d'entrée, lancer une réservation en 1 tap.

```
┌─────────────────────────────────────┐
│  Bonjour, Jean 👋          [Profil] │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐  │
│  │  🚗  Lavage à domicile      │  │
│  │                             │  │
│  │  Pro éco, assuré, chez vous │  │
│  │                             │  │
│  │     [ Réserver maintenant ] │  │  ← CTA principal (pleine largeur)
│  └─────────────────────────────┘  │
│                                     │
│  📍 Zone : Lyon & agglomération ✓   │
│                                     │
│  ─── Formules populaires ───        │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ Extérieur│  │ Complet  │        │
│  │ 35 €     │  │ 85 €     │        │
│  │ ~30 min  │  │ ~90 min  │        │
│  │ [Choisir]│  │ [Choisir]│        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ Intérieur│  │ Detailing│        │
│  │ 45 €     │  │ 180 €    │        │
│  │ ~45 min  │  │ ~3 h     │        │
│  │ [Choisir]│  │ [Choisir]│        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ─── Prochaine réservation ───      │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 🗓 Sam. 6 sept. · 10h00      │  │
│  │ Lavage complet · En attente  │  │
│  │ pro                          │  │
│  │              [ Voir suivi → ]│  │
│  └─────────────────────────────┘  │
│                                     │
│  (ou si aucune réservation :)      │
│  "Aucune réservation à venir"       │
│                                     │
├─────────────────────────────────────┤
│  🏠 Accueil   📋 Réservations  👤  │
└─────────────────────────────────────┘
```

| Zone | Comportement |
|------|--------------|
| CTA "Réserver" | → C04 (catalogue complet) |
| Card formule | → C05 directement (formule pré-sélectionnée) |
| Badge zone | Tap → modal explication zone couverte |
| Prochaine résa | → C10 (suivi) |
| Hors zone | CTA grisé + "Bientôt chez vous" + champ email |

**États vides :** pas de réservation → section masquée ou message neutre.

---

## C04 — Catalogue formules lavage

**Objectif :** Comparer et choisir une formule.

```
┌─────────────────────────────────────┐
│ ← Retour          Choisir formule   │
├─────────────────────────────────────┤
│  ●───○───○───○───○  Étape 1/5      │
├─────────────────────────────────────┤
│                                     │
│  Quelle prestation souhaitez-vous ? │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 🌿 EXTÉRIEUR EXPRESS        │  │
│  │ Carrosserie, jantes, vitres │  │
│  │ ⏱ ~30 min  ·  🍃 Sans eau   │  │
│  │                             │  │
│  │ À partir de 35 €            │  │
│  │                    ( Choisir )│  │
│  └─────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 🪑 INTÉRIEUR                │  │
│  │ Aspiration, plastiques,     │  │
│  │ vitres intérieures          │  │
│  │ ⏱ ~45 min  ·  🍃 Sans eau   │  │
│  │                             │  │
│  │ À partir de 45 €            │  │
│  │                    ( Choisir )│  │
│  └─────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ ⭐ COMPLET          Populaire│  │
│  │ Intérieur + extérieur       │  │
│  │ + finition cire             │  │
│  │ ⏱ ~90 min  ·  🍃 Sans eau   │  │
│  │                             │  │
│  │ À partir de 85 €            │  │
│  │                    ( Choisir )│  │
│  └─────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 💎 DETAILING                │  │
│  │ Décontamination, polish,    │  │
│  │ protection céramique légère │  │
│  │ ⏱ ~3 h  ·  🍃 Sans eau      │  │
│  │                             │  │
│  │ À partir de 180 €           │  │
│  │                    ( Choisir )│  │
│  └─────────────────────────────┘  │
│                                     │
│  ℹ️ Prix "à partir de" pour        │
│     citadine en zone Lyon.          │
│                                     │
└─────────────────────────────────────┘
```

| Action | Destination |
|--------|-------------|
| Choisir | → C05 avec `offer_id` en contexte |
| Retour | → C03 |

---

## C05 — Configuration prestation

**Objectif :** Personnaliser véhicule, options, voir prix live.

```
┌─────────────────────────────────────┐
│ ← Retour          Personnaliser     │
├─────────────────────────────────────┤
│  ○───●───○───○───○  Étape 2/5      │
├─────────────────────────────────────┤
│                                     │
│  Formule : Lavage complet           │
│                                     │
│  ─── Type de véhicule ───          │
│                                     │
│  (•) Citadine        +0 €           │
│  ( ) Berline         +5 €           │
│  ( ) SUV / Break    +10 €           │
│  ( ) Utilitaire     +15 €           │
│                                     │
│  ─── Niveau de saleté ───           │
│                                     │
│  (•) Léger                          │
│  ( ) Normal                         │
│  ( ) Fort            +15 €          │
│                                     │
│  ─── Options ───                    │
│                                     │
│  [✓] Poils animaux              +15 €│
│  [ ] Sièges enfant               +10 €│
│  [ ] Jantes premium              +20 €│
│  [ ] Protection céramique légère +80 €│
│                                     │
│  ─── Commentaire (optionnel) ───    │
│  ┌─────────────────────────────┐  │
│  │ Place parking sous-sol B2   │  │
│  │                             │  │
│  └─────────────────────────────┘  │
│  0/300 caractères                   │
│                                     │
│  ─── Photos (optionnel) ───         │
│  [ 📷 + ] [ 📷 + ] [ 📷 + ]         │
│  Aide le pro à préparer             │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐  │
│  │  Total estimé    97 € TTC   │  │  ← Sticky footer
│  │  Durée ~ 1h45               │  │
│  │                             │  │
│  │     [ Continuer → ]         │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

| Comportement | Détail |
|--------------|--------|
| Prix live | Recalcul à chaque changement (RG-CAT-02) |
| Saleté "Fort" | Peut masquer "Extérieur express" si formule incompatible |
| Photos | Max 5, caméra ou galerie |
| Continuer | → C06, payload booking draft en mémoire |

---

## C06 — Adresse & accès

**Objectif :** Localiser l'intervention, vérifier zone.

```
┌─────────────────────────────────────┐
│ ← Retour            Où ?            │
├─────────────────────────────────────┤
│  ○───○───●───○───○  Étape 3/5      │
├─────────────────────────────────────┤
│                                     │
│  Adresse d'intervention             │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 🔍 12 rue de la République… │  │  ← Autocomplete Google/Mapbox
│  └─────────────────────────────┘  │
│                                     │
│  [ 📍 Utiliser ma position ]        │
│                                     │
│  ┌─────────────────────────────┐  │
│  │                             │  │
│  │      [ Carte interactive ]  │  │  ← Pin draggable
│  │            📍               │  │
│  │                             │  │
│  └─────────────────────────────┘  │
│                                     │
│  Complément d'adresse               │
│  ┌─────────────────────────────┐  │
│  │ Digicode 4521, parking B2   │  │
│  └─────────────────────────────┘  │
│                                     │
│  Instructions pour le pro           │
│  ┌─────────────────────────────┐  │
│  │ Sonner à l'interphone Martin│  │
│  └─────────────────────────────┘  │
│                                     │
│  Adresses enregistrées              │
│  (•) 🏠 Domicile — 12 rue…          │
│  ( ) 💼 Bureau — 45 av.…            │
│  [ + Ajouter une adresse ]          │
│                                     │
│  ✅ Zone couverte · Lyon Est        │
│                                     │
│  ℹ️ Le véhicule doit être accessible │
│     sur une place privée ou autorisée│
│                                     │
├─────────────────────────────────────┤
│         [ Continuer → ]             │
└─────────────────────────────────────┘
```

### État hors zone

```
┌─────────────────────────────────────┐
│  ❌ Zone non couverte pour l'instant │
│                                     │
│  Nous travaillons à étendre notre   │
│  service. Laissez-nous votre email  │
│  pour être prévenu.                 │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ votre@email.com             │  │
│  └─────────────────────────────┘  │
│                                     │
│  [ Me prévenir ]                    │
│                                     │
│  (Bouton Continuer désactivé)       │
└─────────────────────────────────────┘
```

| Action | Destination |
|--------|-------------|
| Continuer (zone OK) | → C07 |
| Me prévenir | Lead stocké (RG-ZONE-03), toast confirmation |

---

## C07 — Créneau

**Objectif :** Choisir date et heure d'intervention.

```
┌─────────────────────────────────────┐
│ ← Retour          Quand ?           │
├─────────────────────────────────────┤
│  ○───○───○───●───○  Étape 4/5      │
├─────────────────────────────────────┤
│                                     │
│  ─── Septembre 2026 ───             │
│                                     │
│  Lun  Mar  Mer  Jeu  Ven  Sam  Dim  │
│   1    2    3    4    5   [6]   7   │  ← Jours passés grisés
│   8    9   10   11   12   13   14   │
│                                     │
│  Sam. 6 septembre                   │
│                                     │
│  ─── Créneaux disponibles ───       │
│                                     │
│  [ 09:00 ]  [ 10:00 ]  [ 11:00 ]   │  ← Créneaux dispo
│  [ 14:00 ]  [ 15:00 ]  [ --:-- ]   │  ← Créneau grisé = complet
│  [ 16:00 ]  [ 17:00 ]              │
│                                     │
│  (•) 10:00 – 11:30                  │  ← Sélectionné (durée incluse)
│                                     │
│  ℹ️ Réservation possible à partir   │
│     de 2 h minimum                  │
│                                     │
│  Durée estimée : 1h45               │
│  Fin prévue vers 11:45              │
│                                     │
├─────────────────────────────────────┤
│         [ Continuer → ]             │
└─────────────────────────────────────┘
```

| Règle UI | Détail |
|----------|--------|
| J+0 | Créneaux < now+2h masqués |
| Créneau complet | Grisé, non cliquable |
| Sélection | 1 seul créneau, highlight bleu/vert |
| Continuer | Désactivé tant qu'aucun créneau choisi → C08 |

---

## C08 — Récapitulatif & paiement

**Objectif :** Valider et payer (pre-auth).

```
┌─────────────────────────────────────┐
│ ← Retour          Confirmation      │
├─────────────────────────────────────┤
│  ○───○───○───○───●  Étape 5/5      │
├─────────────────────────────────────┤
│                                     │
│  ─── Récapitulatif ───              │
│                                     │
│  Prestation                         │
│  Lavage complet                     │
│  SUV · Saleté normale               │
│  + Poils animaux                    │
│                                     │
│  📍 12 rue de la République         │
│     69002 Lyon                      │
│     Digicode 4521                   │
│                                     │
│  🗓 Sam. 6 sept. · 10:00 – 11:45    │
│                                     │
│  👤 Pro assigné après confirmation  │
│                                     │
│  ─── Détail prix ───                │
│                                     │
│  Lavage complet           85,00 €  │
│  Majoration SUV           10,00 €  │
│  Poils animaux            15,00 €  │
│  Frais de service          2,00 €  │
│  ─────────────────────────────     │
│  Total TTC                97,00 €  │
│                                     │
│  ─── Paiement ───                   │
│                                     │
│  💳 Visa ···· 4242                   │
│  [ Changer de carte ]               │
│                                     │
│  ─── Annulation ───                 │
│  Gratuite jusqu'à 24 h avant        │
│  le créneau. [ En savoir plus ]     │
│                                     │
│  [✓] J'accepte les CGV              │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐  │
│  │  Payer 97,00 €              │  │  ← Sticky CTA
│  └─────────────────────────────┘  │
│                                     │
│  🔒 Paiement sécurisé · Stripe      │
└─────────────────────────────────────┘
```

### États paiement

| État | Affichage |
|------|-----------|
| Processing | Overlay loader "Paiement en cours…" |
| Succès | → C09 |
| Échec | Banner rouge "Paiement refusé" + [ Réessayer ] |
| CGV non cochées | Bouton Payer désactivé |

| Lien "Modifier" | Retour étape concernée (C05/C06/C07) |

---

## C09 — Confirmation

**Objectif :** Rassurer, orienter vers suivi.

```
┌─────────────────────────────────────┐
│                                     │
│              ✅                     │
│                                     │
│     Réservation confirmée !         │
│                                     │
│  Réf. CS-20260906-A7B2              │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 🗓 Sam. 6 sept. · 10:00     │  │
│  │ Lavage complet · SUV        │  │
│  │ 12 rue de la République     │  │
│  └─────────────────────────────┘  │
│                                     │
│  🔍 Recherche d'un professionnel…   │
│  ┌─────────────────────────────┐  │
│  │  ◠◠◠  animation pulse      │  │
│  └─────────────────────────────┘  │
│                                     │
│  Vous serez notifié dès qu'un     │
│  pro accepte votre mission.         │
│                                     │
│  [ Suivre ma réservation ]          │
│                                     │
│  [ Retour à l'accueil ]             │
│                                     │
│  📧 Un récapitulatif vous a été     │
│     envoyé par SMS/email.           │
│                                     │
└─────────────────────────────────────┘
```

| Action | Destination |
|--------|-------------|
| Suivre | → C10 |
| Accueil | → C03 |

**Auto-redirect :** après 5 s optionnel vers C10.

---

## C10 — Suivi mission

**Objectif :** Suivre en temps réel, actions contextuelles.

### État 1 — `pending_provider`

```
┌─────────────────────────────────────┐
│ ← Retour          Suivi #A7B2       │
├─────────────────────────────────────┤
│                                     │
│  STATUT                             │
│  ┌─────────────────────────────┐  │
│  │  🔍 Recherche d'un pro…    │  │
│  │  ◠◠◠                        │  │
│  └─────────────────────────────┘  │
│                                     │
│  ─── Timeline ───                   │
│  ● Confirmé          09:12          │
│  ◐ Pro en cours…                    │
│  ○ En route                         │
│  ○ Lavage en cours                  │
│  ○ Terminé                          │
│                                     │
│  ─── Détails ───                    │
│  Lavage complet · SUV               │
│  Sam. 6 sept. · 10:00               │
│  12 rue de la République, Lyon      │
│  Total : 97,00 €                    │
│                                     │
│  [ Annuler la réservation ]         │  ← Visible si > 24h (RG-CANCEL)
│                                     │
└─────────────────────────────────────┘
```

### État 2 — `accepted`

```
┌─────────────────────────────────────┐
│  STATUT : Pro confirmé ✅           │
│                                     │
│  ┌─────────────────────────────┐  │
│  │  [Photo]  Marc D.           │  │
│  │  ⭐ 4.8 (127 avis)           │  │
│  │  🍃 Lavage sans eau          │  │
│  │                             │  │
│  │  [ 📞 Appeler ]             │  │
│  └─────────────────────────────┘  │
│                                     │
│  ─── Timeline ───                   │
│  ● Confirmé                         │
│  ● Pro assigné       09:28          │
│  ○ En route                         │
│  ○ Lavage en cours                  │
│  ○ Terminé                          │
│                                     │
│  [ Signaler un problème ]           │
└─────────────────────────────────────┘
```

### État 3 — `en_route`

```
┌─────────────────────────────────────┐
│  STATUT : En route 🚗               │
│                                     │
│  Marc arrive dans ~12 min           │
│                                     │
│  ┌─────────────────────────────┐  │
│  │     [ Mini-carte + pin ]    │  │
│  │     Pro ········ Vous       │  │
│  └─────────────────────────────┘  │
│                                     │
│  ─── Timeline ───                   │
│  ● Confirmé                         │
│  ● Pro assigné                      │
│  ● En route          09:45          │
│  ○ Lavage en cours                  │
│  ○ Terminé                          │
└─────────────────────────────────────┘
```

### État 4 — `in_progress`

```
┌─────────────────────────────────────┐
│  STATUT : Lavage en cours 🧽        │
│                                     │
│  Marc travaille sur votre véhicule  │
│  Depuis 10:02 · Fin ~11:45          │
│                                     │
│  ─── Timeline ───                   │
│  ● Confirmé                         │
│  ● Pro assigné                      │
│  ● En route                         │
│  ● En cours          10:02          │
│  ○ Terminé                          │
│                                     │
│  ℹ️ Annulation impossible pendant   │
│     la prestation. Contactez le     │
│     support en cas de problème.     │
└─────────────────────────────────────┘
```

### État 5 — `completed` → redirect C11

### État timeout — `unassigned`

```
┌─────────────────────────────────────┐
│  ⚠️ Aucun pro disponible            │
│                                     │
│  Nous n'avons pas trouvé de         │
│  professionnel pour ce créneau.     │
│                                     │
│  [ Choisir un autre créneau ]       │
│  [ Demander un remboursement ]      │
└─────────────────────────────────────┘
```

---

## C11 — Mission terminée & avis (bonus lié à C10)

```
┌─────────────────────────────────────┐
│                                     │
│              🎉                     │
│     Lavage terminé !                │
│                                     │
│  ─── Photos ───                     │
│  Avant          Après               │
│  [img] [img]    [img] [img]         │
│                                     │
│  ─── Votre avis ───                 │
│                                     │
│  Note :  ☆ ☆ ☆ ☆ ☆  → tap pour noter│
│                                     │
│  Commentaire (optionnel)            │
│  ┌─────────────────────────────┐  │
│  │ Très satisfait, voiture     │  │
│  │ impeccable !                │  │
│  └─────────────────────────────┘  │
│                                     │
│  Tags :                             │
│  [ Ponctualité ] [ Qualité ]        │
│  [ Propreté ] [ Sympathie ]         │
│                                     │
│  [ Envoyer mon avis ]               │
│  [ Plus tard ]                      │
│                                     │
└─────────────────────────────────────┘
```

---

# PARTIE PRO

---

## P02 — Home Pro (missions)

**Objectif :** Voir et traiter les missions entrantes.

```
┌─────────────────────────────────────┐
│  Bonjour, Marc 👋           [Profil]│
│  ⭐ 4.8 · 98% acceptation           │
├─────────────────────────────────────┤
│                                     │
│  [ Nouvelles (2) ] [ À venir ] [ En cours ]  ← Tabs
│                                     │
│  ─── Tab : Nouvelles ───            │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 🆕 Il y a 3 min              │  │
│  │ Sam. 6 sept. · 10:00        │  │
│  │ Lavage complet · SUV          │  │
│  │ 📍 Gerland, Lyon (~2.3 km)   │  │  ← Quartier, pas adresse exacte
│  │ 💰 Vous gagnez : 77,60 € net  │  │
│  │ ⏱ ~1h45                      │  │
│  │                             │  │
│  │        [ Voir détail → ]    │  │
│  └─────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 🆕 Il y a 8 min              │  │
│  │ Sam. 6 sept. · 14:00        │  │
│  │ Extérieur express · Citadine  │  │
│  │ 📍 Villeurbanne (~4.1 km)   │  │
│  │ 💰 Vous gagnez : 28,00 € net  │  │
│  │ ⏱ ~30 min                    │  │
│  │                             │  │
│  │        [ Voir détail → ]    │  │
│  └─────────────────────────────┘  │
│                                     │
│  ─── Tab : À venir ───              │
│  (missions acceptées, futures)      │
│                                     │
│  ─── Tab : En cours ───             │
│  (mission active du jour)           │
│                                     │
│  ─── État vide ───                  │
│  "Aucune nouvelle mission"          │
│  [ Activer les notifications ]      │
│                                     │
├─────────────────────────────────────┤
│  📋 Missions   📅 Planning   💰    │
└─────────────────────────────────────┘
```

| Comportement | Détail |
|--------------|--------|
| Badge count | Nombre missions `pending` non vues |
| Distance | Calculée depuis adresse base pro |
| Net affiché | Montant après commission (RG-PAY-03) |
| Tap card | → P03 |
| Pull-to-refresh | Recharge liste |

### Banner KYC non validé

```
┌─────────────────────────────────────┐
│ ⚠️ Compte en attente de validation  │
│ Complétez votre dossier pour        │
│ recevoir des missions.              │
│ [ Finaliser mon inscription → ]     │  → P01
└─────────────────────────────────────┘
```

---

## P03 — Détail mission (avant acceptation)

**Objectif :** Décider accepter / refuser avec toutes les infos (sauf adresse exacte).

```
┌─────────────────────────────────────┐
│ ← Retour          Nouvelle mission  │
├─────────────────────────────────────┤
│                                     │
│  ⏱ Expire dans 08:42                │  ← Timer si broadcast exclusif
│                                     │
│  ─── Créneau ───                    │
│  🗓 Sam. 6 septembre 2026           │
│  🕐 10:00 – 11:45 (1h45)            │
│                                     │
│  ─── Prestation ───                 │
│  Lavage complet                     │
│  SUV · Saleté normale               │
│  + Poils animaux                    │
│                                     │
│  ─── Localisation ───               │
│  📍 Gerland, 69007 Lyon             │
│  ~2.3 km de votre base              │
│  (Adresse exacte après acceptation) │
│                                     │
│  ─── Rémunération ───               │
│  Montant client      97,00 €        │
│  Commission (20%)   - 19,40 €        │
│  ─────────────────────────────     │
│  Votre gain net       77,60 €       │
│                                     │
│  ─── Commentaire client ───         │
│  "Place parking sous-sol B2,        │
│   digicode 4521"                    │
│                                     │
│  ─── Photos client ───              │
│  [img] [img]                        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [     Refuser     ]  [ Accepter ]  │  ← 2 CTAs égaux ou Accepter primary
│                                     │
└─────────────────────────────────────┘
```

### Modal Refuser

```
┌─────────────────────────────────────┐
│  Motif de refus                     │
│                                     │
│  ( ) Trop loin                      │
│  ( ) Créneau indisponible           │
│  ( ) Prestation non proposée        │
│  ( ) Autre                          │
│                                     │
│  [ Confirmer le refus ]             │
└─────────────────────────────────────┘
```

| Action | Résultat |
|--------|----------|
| Accepter | Booking → `accepted`, lock mission, → P04 |
| Refuser | Mission retirée, score acceptation ↓, → P02 |
| Timer expire | Mission retirée de la liste |

---

## P04 — Mission acceptée / En route

**Objectif :** Naviguer, communiquer statut au client.

```
┌─────────────────────────────────────┐
│ ← Retour          Mission #A7B2     │
├─────────────────────────────────────┤
│                                     │
│  STATUT : Acceptée ✅               │
│                                     │
│  ─── Client ───                     │
│  Jean M.                            │
│  [ 📞 Appeler le client ]           │
│                                     │
│  ─── Adresse ───                    │
│  12 rue de la République            │
│  69002 Lyon                         │
│  Digicode 4521, parking B2          │
│  "Sonner interphone Martin"         │
│                                     │
│  [ 🗺 Ouvrir dans Maps ]            │
│                                     │
│  ┌─────────────────────────────┐  │
│  │     [ Carte + itinéraire ]    │  │
│  └─────────────────────────────┘  │
│                                     │
│  ─── Prestation ───                 │
│  Lavage complet · SUV               │
│  Sam. 6 sept. · 10:00 – 11:45       │
│  Gain net : 77,60 €                 │
│                                     │
│  ─── Photos client ───              │
│  [img] [img]                        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [    🚗 Je suis en route    ]      │  ← Primary CTA
│                                     │
│  [ Annuler la mission ]             │  ← Secondaire, motif obligatoire
│                                     │
└─────────────────────────────────────┘
```

### Après tap "Je suis en route" → statut `en_route`

```
┌─────────────────────────────────────┐
│  STATUT : En route 🚗               │
│                                     │
│  Le client a été notifié.           │
│                                     │
│  [    📍 Je suis arrivé    ]        │  ← → statut in_progress, → P05
│                                     │
│  [ 🗺 Navigation ]  [ 📞 Client ]   │
└─────────────────────────────────────┘
```

| Transition | Règle |
|------------|-------|
| En route | Notif client (RG-NOTIF) |
| Arrivé | Option géofence ≤ 200 m (RG-BOOK-03) |
| Annuler | Motif obligatoire, pénalité si < 2h (RG-CANCEL) |

---

## P05 — Exécution / Checklist / Photos

**Objectif :** Exécuter la prestation, documenter, clôturer.

```
┌─────────────────────────────────────┐
│ ← Retour          En cours          │
├─────────────────────────────────────┤
│                                     │
│  Lavage complet · SUV               │
│  Démarré à 10:02                    │
│  Durée estimée : 1h45               │
│                                     │
│  ─── Checklist ───                  │
│                                     │
│  Extérieur                          │
│  [✓] Prélavage / décontamination    │
│  [✓] Carrosserie                    │
│  [✓] Jantes                         │
│  [✓] Vitres extérieures             │
│  [✓] Plastiques extérieurs          │
│  [ ] Finition cire                  │
│                                     │
│  Intérieur                          │
│  [✓] Aspiration sièges / sol        │
│  [ ] Nettoyage plastiques           │
│  [ ] Vitres intérieures             │
│  [ ] Traitement poils animaux       │
│                                     │
│  ─── Photos AVANT (min. 2) ───      │
│  [img ✓] [img ✓] [ + Ajouter ]      │
│                                     │
│  ─── Photos APRÈS (min. 2) ───      │
│  [ + Ajouter ] [ + Ajouter ]        │
│                                     │
│  Note interne (optionnel)           │
│  ┌─────────────────────────────┐  │
│  │ Tache tenace tableau bord   │  │
│  └─────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [   ✅ Terminer la prestation   ]  │
│                                     │
└─────────────────────────────────────┘
```

### Validation clôture

| Condition | Message si non rempli |
|-----------|----------------------|
| Checklist items obligatoires cochés | "Complétez la checklist" |
| ≥ 2 photos avant | "Ajoutez au moins 2 photos avant" |
| ≥ 2 photos après | "Ajoutez au moins 2 photos après" |

### Modal confirmation clôture

```
┌─────────────────────────────────────┐
│  Terminer la prestation ?           │
│                                     │
│  Le client sera notifié et le       │
│  paiement sera capturé.             │
│                                     │
│  Gain net : 77,60 €                 │
│                                     │
│  [ Annuler ]  [ Confirmer ]         │
└─────────────────────────────────────┘
```

| Action | Résultat |
|--------|----------|
| Confirmer | → `completed`, capture paiement, → P06 (écran gains/succès) |
| Retour | Checklist sauvegardée en draft |

### Écran succès post-clôture (transition P06)

```
┌─────────────────────────────────────┐
│              ✅                     │
│     Prestation terminée !           │
│                                     │
│  + 77,60 € ajoutés à votre solde    │
│  Versement sous 2-7 jours ouvrés    │
│                                     │
│  [ Voir mes gains ]                 │
│  [ Retour aux missions ]            │
└─────────────────────────────────────┘
```

---

# Flux récapitulatif

```
CLIENT                              PRO
──────                              ───
C03 Home
  ↓
C04 Formule
  ↓
C05 Config
  ↓
C06 Adresse
  ↓
C07 Créneau
  ↓
C08 Paiement ──────────────────→  P02 Nouvelle mission
  ↓                                    ↓
C09 Confirmation                       P03 Détail
  ↓                                    ↓ accept
C10 Suivi ←── notifs statut ────→  P04 En route
  ↓                                    ↓
C11 Avis ←── completed ──────────→  P05 Checklist/Photos
```

---

# Notes design system (recommandations)

| Token | Valeur suggérée |
|-------|-----------------|
| Primary | `#1B5E20` (vert éco) ou `#1565C0` (bleu confiance) |
| Success | `#2E7D32` |
| Warning | `#F57C00` |
| Error | `#C62828` |
| Radius cards | 12 px |
| CTA height | 48 px min (touch target) |
| Font | Inter / SF Pro |

**Accessibilité :** contrast ratio ≥ 4.5:1, labels sur tous les champs, statuts pas uniquement par couleur (icône + texte).

---

## Références

- [Cahier des charges](cahier-des-charges.md)
- [Spécification Figma](spec-figma.md)
- [Règles de gestion](regles-de-gestion.md)
- [Schéma base de données](schema-base-de-donnees.md)
