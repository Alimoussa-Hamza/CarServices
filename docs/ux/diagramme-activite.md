# Diagrammes d’activité — produit CarWash

> **UML** (couloirs, décisions, FAIT / A FAIRE) : [uml-activite-produit.md](uml-activite-produit.md) + [uml-activite-produit.puml](uml-activite-produit.puml).  
> **Toutes les actions** (notif, toggles, permissions) : [uml-activite-actions.md](uml-activite-actions.md).  
> Ci-dessous : **clic par clic** condensé (happy path).

Légende : **FAIT** = déjà dans une app · **A FAIRE** = pas encore. Imagination = écrans du cahier (`C00–C14` / `P00–P09` / `A01–A09`), pas le code.

---

## 1. Claire — app client

```mermaid
flowchart TD
  classDef fait fill:#E8F3FA,stroke:#0B4F8A,color:#0F172A
  classDef todo fill:#FFF4E5,stroke:#E67E22,color:#0F172A

  C0([Ouvre l'app]) --> C1[Splash]
  C1 --> C2[Auth : saisit téléphone]
  C2 --> C3{Clic Envoyer le code}
  C3 -->|OK| C4[Saisit 6 chiffres + CGU]
  C3 -->|erreur| C2
  C4 --> C5{Clic Continuer}
  C5 -->|code faux| C4
  C5 -->|OK| C02[Onboarding C02 skippable]
  C02 --> C6[Home]
  C6 --> C7{Clic Réserver maintenant}
  C7 --> C8[Catalogue]
  C8 --> C9{Clic une formule}
  C9 --> C10[Config]
  C10 --> C11{Clic Continuer}
  C11 --> C12[Adresse]
  C12 --> C13{Clic Continuer}
  C13 -->|hors zone| C12
  C13 -->|couverte| C14[Créneau]
  C14 --> C15{Clic Continuer}
  C15 --> C16[Récap Payer]
  C16 --> C17{Clic Payer}
  C17 -->|carte refusée| C16
  C17 -->|pre-auth OK| C18[Recherche d'un pro]
  C18 --> C19[Suivi]
  C19 --> C20{Un pro a accepté avant T2 ?}
  C20 -->|oui| C21[Pro confirmé → Terminé]
  C21 --> C23{Clic Envoyer avis}
  C23 --> C24[Réservations]
  C20 -->|non| C25[Unassigned]
  C19 --> C26{Clic Annuler}
  C26 --> C27[Annulé RG-CANCEL]
  C6 --> C14b[C14 Aide / litige]

  C1:::fait
  C2:::fait
  C4:::fait
  C02:::todo
  C6:::fait
  C8:::fait
  C10:::fait
  C12:::fait
  C14:::fait
  C16:::fait
  C18:::fait
  C19:::fait
  C21:::fait
  C24:::fait
  C25:::fait
  C27:::fait
  C14b:::todo
```

---

## 2. Marc — app pro

```mermaid
flowchart TD
  classDef todo fill:#FFF4E5,stroke:#E67E22,color:#0F172A

  P0([Ouvre l'app]) --> P1[Auth téléphone]
  P1 --> P2{Clic Envoyer le code}
  P2 --> P3[OTP + CGU]
  P3 --> P4{Clic Continuer}
  P4 -->|OK| P5[KYC 1/7]
  P5 --> Pn[Autoriser notifs]
  Pn --> P6{Clic Continuer}
  P6 --> P7[Envoyer mon dossier]
  P7 --> P8[Pending · 0 mission]
  P8 --> P9{Admin a approuvé ?}
  P9 -->|refusé| P5
  P9 -->|oui| P10[Activer les virements]
  P10 --> P12[Onglet Nouvelles]
  P12 --> P14[Détail net + quartier]
  P14 --> P15{Clic Accepter ?}
  P15 -->|Accepter + dispo| P17[Adresse Maps tel]
  P17 --> P18[En route puis Arrivé]
  P18 --> P20[Photos + checklist]
  P20 --> P22{Clic Terminer}
  P22 -->|2+2 OK| P23[Clôture]

  P1:::todo
  P3:::todo
  P5:::todo
  Pn:::todo
  P7:::todo
  P8:::todo
  P10:::todo
  P12:::todo
  P14:::todo
  P17:::todo
  P18:::todo
  P20:::todo
  P23:::todo
```

---

## 3. Ops — admin web

```mermaid
flowchart TD
  classDef fait fill:#E8F3FA,stroke:#0B4F8A,color:#0F172A
  classDef todo fill:#FFF4E5,stroke:#E67E22,color:#0F172A

  A0([Ouvre :3001]) --> A1[Login]
  A1 --> A3[Dashboard]
  A3 --> A4[KYC Approuver / Refuser]
  A3 --> A9[Réservations / Rembourser]
  A3 --> A13[Litiges / 3 décisions]
  A3 --> A16[Catalogue / Zones / Config]
  A3 --> A08[A08 Masquer avis]
  A9 --> A06b[Reassign / force cancel]
  A16 --> A05b[Éditeur polygone]

  A1:::fait
  A3:::fait
  A4:::fait
  A9:::fait
  A13:::fait
  A16:::fait
  A08:::todo
  A06b:::todo
  A05b:::todo
```

---

## 4. Tableau clic — Claire

| # | Il est sur | Il clique | Succès | Sinon | Produit |
|---|------------|-----------|--------|--------|---------|
| 1 | Splash | (auto) | Auth | — | FAIT |
| 2 | Auth | Envoyer le code | Champ OTP | Erreur / rate limit | FAIT |
| 3 | OTP + CGU | Continuer | Home | « Code incorrect. » | FAIT |
| 4 | Onboarding C02 | Continuer / Plus tard | Home | — | A FAIRE |
| 5 | Home | Réserver maintenant | Catalogue | Flag wash off | FAIT |
| 6 | Catalogue | Une formule | Config | — | FAIT |
| 7 | Config | Continuer | Adresse | — | FAIT |
| 8 | Adresse | Continuer | Créneau | Hors zone, pas de Payer | FAIT |
| 9 | Créneau | Continuer | Récap | — | FAIT |
| 10 | Récap | Payer | Confirmation | « Paiement refusé… » | FAIT |
| 11 | Suivi | (attend) | Pro confirmé | T2 : unassigned / refund | FAIT |
| 12 | Suivi | Annuler | Annulé + RG-CANCEL | Après en cours → litige | FAIT |
| 13 | Terminé | Envoyer avis | Liste | Fenêtre 72 h | FAIT |
| 14 | Profil / Aide C14 | Ouvrir litige | Litige ouvert | — | A FAIRE |

## 5. Tableau clic — Marc

| # | Il est sur | Il clique | Succès | Sinon | Produit |
|---|------------|-----------|--------|--------|---------|
| 1 | Auth P00 | Continuer | KYC 1/7 | Code incorrect | A FAIRE |
| 2 | Notifs | Autoriser / Plus tard | Suite KYC | — | A FAIRE |
| 3 | KYC P01 | Continuer / Envoyer | Pending | Champ invalide | A FAIRE |
| 4 | Pending | (attend admin) | Écran virements | Refusé → corriger | A FAIRE |
| 5 | Virements | Activer | Missions | Connect incomplet | A FAIRE |
| 6 | Nouvelles | Une carte | Détail (quartier) | Liste vide | A FAIRE |
| 7 | Détail | Accepter | Adresse complète | Déjà prise / Refuser | A FAIRE |
| 8 | Mission | En route puis Arrivé | Écran photos | — | A FAIRE |
| 9 | Photo | Caméra | Miniature + envoi | Réglages permission | A FAIRE |
| 10 | Exécution | Terminer | Clôture + net | Grisé si pas 2+2 | A FAIRE |

## 6. Tableau clic — Ops

| # | Il est sur | Il clique | Succès | Sinon | Produit |
|---|------------|-----------|--------|--------|---------|
| 1 | Login | Connexion | Dashboard | Mauvais mdp | FAIT |
| 2 | KYC | Approuver / Refuser | File à jour | Motif < 5 car. | FAIT |
| 3 | Catalogue / Zones / Config | Enregistrer | Sauvé | Hors bornes | FAIT |
| 4 | Booking | Rembourser | Annulé admin | Pas remboursable | FAIT |
| 5 | Litige | 3 décisions | Tranché | Split : notes | FAIT |
| 6 | Booking | Reassign / force cancel | — | — | A FAIRE |
| 7 | A08 | Masquer avis | Avis caché | — | A FAIRE |
| 8 | Config | Flag wash | Home sans CTA | — | A FAIRE |
