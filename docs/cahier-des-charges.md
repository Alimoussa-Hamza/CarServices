# Cahier des charges — CARSERVICE MVP

> **Version :** 1.0  
> **Date :** 26 août 2026  
> **Périmètre :** Lavage véhicule à domicile (France)

---

## 1. Objet du projet

Concevoir une application marketplace mettant en relation **clients** et **professionnels** pour des **lavages de véhicules à domicile** (sans eau / vapeur), avec paiement sécurisé, suivi de mission, avis, et une architecture permettant d'ajouter d'autres catégories de services ultérieurement.

---

## 2. Objectifs

| Objectif | Indicateur cible |
|----------|------------------|
| Réservation rapide | < 2 minutes |
| Prix transparent | Prix fixe affiché avant paiement |
| Confiance | Pro vérifié (SIRET, RC Pro), méthode éco |
| Paiement sécurisé | Pre-auth + capture à clôture |
| Qualité mesurable | Avis, photos avant/après, litiges |
| Évolutivité | Nouvelle catégorie sans refonte du parcours |

---

## 3. Périmètre MVP

### IN (inclus)

- Applications / espaces : **Client**, **Pro**, **Admin**
- Catalogue lavage uniquement (`category = wash`)
- Formules + options + prix selon type véhicule / zone
- Géolocalisation adresse d'intervention
- Matching / assignation pros
- Paiement in-app (carte bancaire)
- Suivi mission + notifications push/SMS
- KYC pro (SIRET, RC Pro, méthode éco)
- Avis + photos avant/après
- Litiges basiques
- 1 ville / zone pilote (configurable)

### OUT (hors MVP)

- Mécanique, pneus, batterie (prévus en évolution)
- Chat libre complexe (messages système uniquement)
- Abonnements flottes B2B avancés
- Multi-pays / multi-devises
- Lavage à l'eau classique non conforme
- Devis libre négocié

---

## 4. Acteurs

| Acteur | Rôle |
|--------|------|
| **Client** | Particulier réservant un lavage |
| **Pro** | Auto-entrepreneur / société lavage mobile |
| **Admin** | Opérateur plateforme (validation, litiges, catalogue) |
| **Système** | Matching, paiements, notifications, timers |

---

## 5. Hypothèses produit

- Prix **fixes** affichés (pas de devis négocié)
- Assignation : **proposition aux pros** puis acceptation (broadcast limité)
- Client voit le pro **après acceptation**
- Annulation selon grilles horaires (voir [Règles de gestion](regles-de-gestion.md))
- Méthodes autorisées : **sans eau** et/ou **vapeur** uniquement

---

## 6. Parcours globaux

### 6.1 Client

```
Splash → Auth → Home → Formule → Config (véhicule/options) → Adresse → Créneau
  → Récap/Paiement → Suivi → Terminé/Avis
```

### 6.2 Pro

```
Splash → Auth → Onboarding KYC → Home missions → Détail → Accepter
  → En route → Checklist/Photos → Clôturer → Gains
```

### 6.3 Admin

```
Login → Dashboard → Pros à valider → Catalogue → Bookings/Litiges → Zones/Pricing
```

---

## 7. Spécifications fonctionnelles — Écrans CLIENT

### C00 — Splash / Bootstrap

| Élément | Détail |
|---------|--------|
| **But** | Charger session, feature flags, ville active |
| **Affiche** | Logo, loader |
| **Actions** | Token valide → Home ; sinon → Auth |
| **Règles** | Si `wash` désactivé pour la zone → écran "Bientôt disponible" |

---

### C01 — Authentification

| Élément | Détail |
|---------|--------|
| **But** | Créer compte / se connecter |
| **Champs** | Téléphone (MVP) + OTP SMS ; ou email + mot de passe |
| **Actions** | Envoyer code, Valider, Accepter CGU |
| **États** | Loading, code invalide, trop de tentatives |
| **Règles** | 1 compte / téléphone ; CGU + politique confidentialité obligatoires |

---

### C02 — Onboarding client (1re fois)

| Élément | Détail |
|---------|--------|
| **But** | Collecter infos de base |
| **Champs** | Prénom, véhicule principal (optionnel), adresse favorite |
| **Actions** | Continuer / Plus tard |
| **Règles** | Skippable ; adresse complète exigée avant paiement |

---

### C03 — Home Client

| Élément | Détail |
|---------|--------|
| **But** | Point d'entrée réservation |
| **Affiche** | Hero CTA "Réserver un lavage", formules populaires (3–4 cards), prochaine réservation, badge zone desservie |
| **Actions** | Réserver, Mes réservations, Profil |
| **Règles** | N'affiche que les `ServiceCategory` actives pour la zone |
| **Évolutivité** | Grille de catégories ; MVP = 1 carte "Lavage" |

---

### C04 — Catalogue formules lavage

| Élément | Détail |
|---------|--------|
| **But** | Choisir une offre |
| **Affiche** | Nom, durée estimée, prix "à partir de", inclus/exclus, badge Éco |
| **Actions** | Sélectionner formule → C05 |
| **Règles** | Prix "à partir de" = prix citadine zone courante, hors options |

**Formules MVP :**

1. Extérieur express
2. Intérieur
3. Complet (intérieur + extérieur)
4. Detailing / protection

---

### C05 — Configuration prestation

| Élément | Détail |
|---------|--------|
| **But** | Personnaliser la commande |
| **Champs** | Type véhicule (citadine / berline / SUV-break / utilitaire), niveau saleté (léger / normal / fort), options (poils, sièges enfant, jantes…), commentaire (max 300 car.), photos préalable (0–5) |
| **Affiche** | Prix recalculé en live + durée estimée |
| **Actions** | Continuer → C06 |
| **Règles** | Chaque option a `price_delta` + `duration_delta` ; type véhicule applique coefficient ou majoration fixe |

---

### C06 — Adresse & accès

| Élément | Détail |
|---------|--------|
| **But** | Définir le lieu d'intervention |
| **Champs** | Adresse autocomplete, complément (digicode, étage), instructions accès, pin ajustable |
| **Actions** | Utiliser ma position, Continuer |
| **Règles** | Adresse dans zone active ; sinon message "Zone non couverte" + captation lead (email/tel) |

---

### C07 — Créneau

| Élément | Détail |
|---------|--------|
| **But** | Choisir date/heure |
| **Affiche** | Calendrier J→J+14, créneaux 1 h |
| **Règles** | Délai min +2 h ; jours fériés / dimanche configurables |

---

### C08 — Récapitulatif & paiement

| Élément | Détail |
|---------|--------|
| **But** | Confirmer et payer |
| **Affiche** | Formule, options, véhicule, adresse, créneau, détail prix TTC, frais service, politique annulation |
| **Actions** | Payer, Modifier étapes |
| **Paiement** | Pre-authorization carte |
| **Règles** | Pas de booking confirmé sans paiement autorisé |

---

### C09 — Confirmation

| Élément | Détail |
|---------|--------|
| **But** | Rassurer le client |
| **Affiche** | N° réservation, créneau, "Recherche d'un pro…", CTA suivi |
| **Notif** | Push + email/SMS récap |

---

### C10 — Suivi mission (temps réel)

| Statut | Affichage |
|--------|-----------|
| `pending_provider` | Recherche pro |
| `accepted` | Pro trouvé (nom, note, photo) |
| `en_route` | ETA |
| `in_progress` | Lavage en cours |
| `completed` | Terminé |
| `cancelled` / `disputed` | Annulé / Litige |

**Actions :** Annuler (si autorisé), Contacter pro, Signaler un problème

---

### C11 — Mission terminée & avis

| Élément | Détail |
|---------|--------|
| **Affiche** | Photos avant/après, montant, bouton avis |
| **Champs** | Note 1–5, commentaire, tags (ponctualité, qualité, propreté) |
| **Règles** | Avis sous 72 h ; 1 avis / booking |

---

### C12 — Mes réservations

Listes : à venir / passées / annulées. Action : ouvrir détail (C10/C11).

---

### C13 — Profil client

Infos perso, véhicules, adresses, moyens de paiement, CGU, support, suppression compte (RGPD).

---

### C14 — Support / Aide

FAQ lavage, contact support, ouverture litige.

---

## 8. Spécifications fonctionnelles — Écrans PRO

### P00 — Auth Pro

Identique logique C01, rôle `provider`.

---

### P01 — Onboarding KYC (wizard)

| Étape | Contenu |
|-------|---------|
| 1 | Infos société (raison sociale, SIRET, IBAN) |
| 2 | Upload RC Pro (PDF/photo) + date validité |
| 3 | Méthodes : sans eau / vapeur (≥ 1 obligatoire) |
| 4 | Zones d'intervention (rayon + adresse base) |
| 5 | Formules lavage proposées (capabilities) |
| 6 | Dispo hebdomadaire |
| 7 | Photo profil + bio |

**Statuts KYC :** `draft` → `submitted` → `approved` | `rejected`

**Règle :** Aucune mission tant que `approved` + RC Pro valide.

---

### P02 — Home Pro (missions)

Onglets : Nouvelles | À venir | En cours.

Card mission : heure, quartier (pas adresse exacte avant acceptation), formule, prix net, distance.

---

### P03 — Détail mission (avant acceptation)

Affiche : formule, options, type véhicule, créneau, zone approximative, rémunération nette, commentaire client.

Actions : Accepter / Refuser.

---

### P04 — Mission acceptée

Adresse complète, digicode, tel client, navigation GPS.

Actions : "Je suis en route", "Arrivé / Démarrer", Annuler (motifs limités).

---

### P05 — Exécution / Checklist

Checklist dynamique selon offre. Photos : min. 2 avant + 2 après.

Action : Terminer prestation → P06.

**Règle :** Clôture impossible sans photos min + checklist obligatoire cochée.

---

### P06 — Clôture & paiement

Récap, montant net, délai versement. Passage `completed` → capture paiement + commission.

---

### P07 — Planning / Disponibilités

Calendrier, blocage créneaux, pause ponctuelle.

---

### P08 — Gains & virements

Historique, solde en transit, virements Stripe, factures basiques.

---

### P09 — Profil Pro

Zones, formules actives, documents (alerte expiration RC Pro), note moyenne, stats.

---

## 9. Spécifications fonctionnelles — Écrans ADMIN

### A01 — Login admin

Email + 2FA recommandé.

---

### A02 — Dashboard

KPIs : GMV, bookings, taux acceptation, délai matching, NPS, litiges ouverts, pros pending.

---

### A03 — Validation pros

Liste KYC, viewer documents, Approuver / Refuser + motif.

---

### A04 — Catalogue

CRUD `ServiceCategory`, `ServiceOffer`, options, durées, majorations véhicule, activation par zone.

---

### A05 — Zones & pricing

Polygones / codes postaux, coefficient zone, horaires ouverture.

---

### A06 — Bookings

Recherche, détail, reassign pro, remboursement, force cancel.

---

### A07 — Litiges

File : motif, preuves, décision (rembourse client / paie pro / partage).

---

### A08 — Avis & modération

Masquer avis abusifs, ban temporaire pro/client.

---

### A09 — Config

Commission %, frais service, délais annulation, timeout matching, feature flags catégories.

---

## 10. Critères d'acceptation MVP

1. Client en zone couverte réserve un lavage complet, paie, reçoit un pro sous T2.
2. Pro non KYC ne voit aucune mission.
3. Clôture sans 2+2 photos → refusée.
4. Annulation > 24 h → remboursement total.
5. Hors zone → impossible de payer + message clair.
6. Admin désactive une offre → disparaît du catalogue, bookings anciens intacts.
7. Feature flag off sur `wash` → home sans CTA lavage.

---

## 11. Roadmap d'évolution

| Phase | Contenu |
|-------|---------|
| **0** | Lavage, 1 ville |
| **1** | Abonnements lavage |
| **2** | Flottes B2B |
| **3** | Service adjacent (batterie) |
| **4** | Mécanique légère (KYC diplômes) |

---

## 12. Références

- [Wireframes textuels](wireframes.md)
- [Spécification Figma](spec-figma.md)
- [Règles de gestion](regles-de-gestion.md)
- [Schéma base de données](schema-base-de-donnees.md)
