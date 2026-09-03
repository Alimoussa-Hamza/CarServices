# Backlog MVP — CARSERVICE

> **Version :** 1.0  
> **Sprint cible :** MVP lavage · 1 ville pilote  
> **Format :** User stories + critères d’acceptation (Given/When/Then)

**Backlog détaillé type Jira :** [backlog-jira.md](backlog-jira.md) (14 Epics · 14 Modules · 104 Stories · 197 Tasks)  
**Import Jira :** [backlog/jira-import.csv](backlog/jira-import.csv)

---

## Epic E1 — Authentification & comptes

### US-E1-01 — Inscription client par OTP
**En tant que** client, **je veux** me connecter avec mon numéro de téléphone **afin de** réserver sans mot de passe.

**Critères :**
- Given numéro FR valide, When j’envoie OTP, Then SMS reçu sous 30 s
- Given OTP correct, When je valide, Then compte créé + JWT
- Given OTP incorrect 3×, Then rate limit 5 min (RG-SEC)
- Given CGU non acceptées, Then impossible de continuer

**Priorité :** P0 · **Points :** 5

---

### US-E1-02 — Inscription pro + onboarding KYC
**En tant que** pro, **je veux** compléter mon dossier **afin de** recevoir des missions.

**Critères :**
- Given wizard KYC complet, When soumis, Then statut `submitted`
- Given KYC non `approved`, Then aucune mission visible (RG-KYC-01)
- Given RC Pro expirée, Then blocage missions (RG-KYC-02)

**Priorité :** P0 · **Points :** 8

---

## Epic E2 — Catalogue & zones

### US-E2-01 — Consulter formules lavage
**En tant que** client en zone couverte, **je veux** voir les formules **afin de** choisir ma prestation.

**Formules MVP :**

| Slug | Nom | Prix base (citadine) | Durée |
|------|-----|----------------------|-------|
| `wash-exterior` | Extérieur express | 35 € | 30 min |
| `wash-interior` | Intérieur | 45 € | 45 min |
| `wash-full` | Complet | 85 € | 90 min |
| `wash-detailing` | Detailing | 180 € | 180 min |

**Options :** poils +15 € · sièges enfant +10 € · jantes premium +20 € · céramique légère +80 €

**Majorations véhicule :** berline +5 € · SUV +10 € · utilitaire +15 €

**Priorité :** P0 · **Points :** 5

---

### US-E2-02 — Vérifier zone géographique
**En tant que** client, **je veux** savoir si mon adresse est couverte **afin de** ne pas payer hors zone.

**Critères :**
- Given adresse dans polygone zone active, When je valide, Then badge “Zone couverte”
- Given hors zone, When j’entre adresse, Then message + capture email (RG-ZONE-03)

**Priorité :** P0 · **Points :** 5

---

## Epic E3 — Réservation & paiement

### US-E3-01 — Créer réservation avec prix snapshot
**En tant que** client, **je veux** réserver un créneau **afin d’** obtenir un lavage à domicile.

**Critères :**
- Given formule + options + véhicule + adresse + créneau, When je paie, Then booking `payment_authorized`
- Given paiement OK, Then prix figé snapshot (RG-CAT-03)
- Given créneau < now+2h, Then créneau indisponible

**Priorité :** P0 · **Points :** 13

---

### US-E3-02 — Pre-authorization Stripe
**En tant que** plateforme, **je veux** pré-autoriser la carte **afin de** capturer à la clôture.

**Critères :**
- Given PaymentIntent créé, When client confirme, Then statut `requires_capture`
- Given booking annulé >24h, Then auth libérée (RG-PAY-05)

**Priorité :** P0 · **Points :** 8

---

## Epic E4 — Matching & exécution

### US-E4-01 — Broadcast mission aux pros éligibles
**En tant que** système, **je veux** proposer la mission aux pros **afin de** trouver un intervenant.

**Critères :**
- Given booking `pending_provider`, When matching, Then top 5–10 pros notifiés (RG-MATCH-03)
- Given pro accepte, Then booking `accepted` + verrou exclusif
- Given timeout T2, Then `unassigned` + choix client (RG-MATCH-05)

**Priorité :** P0 · **Points :** 13

---

### US-E4-02 — Exécuter prestation avec photos
**En tant que** pro, **je veux** clôturer avec checklist + photos **afin de** prouver la qualité.

**Critères :**
- Given min 2 photos avant + 2 après, When je clôture, Then `completed`
- Given checklist incomplète, Then clôture refusée (RG-BOOK-04)

**Priorité :** P0 · **Points :** 8

---

### US-E4-03 — Suivi temps réel client
**En tant que** client, **je veux** suivre le statut **afin de** savoir quand le pro arrive.

**Statuts :** pending_provider → accepted → en_route → in_progress → completed

**Priorité :** P0 · **Points :** 5

---

## Epic E5 — Avis & litiges

### US-E5-01 — Laisser un avis
**En tant que** client, **je veux** noter le pro **afin de** garantir la qualité marketplace.

**Critères :**
- Given booking `completed`, When < 72h, Then avis possible (RG-QUAL-05)
- Given 1 avis max / booking (RG-QUAL-04)

**Priorité :** P1 · **Points :** 3

---

### US-E5-02 — Ouvrir litige
**En tant que** client, **je veux** signaler un problème **afin d’** être remboursé si nécessaire.

**Critères :**
- Given < 48h après completed, When j’ouvre litige, Then versement pro gelé (RG-DISPUTE-03)

**Priorité :** P1 · **Points :** 5

---

## Epic E6 — Admin

### US-E6-01 — Valider KYC pro
**En tant qu’** admin, **je veux** approuver/rejeter les dossiers **afin de** contrôler la qualité réseau.

**Priorité :** P0 · **Points :** 5

---

### US-E6-02 — Gérer catalogue & zones
**En tant qu’** admin, **je veux** CRUD offres et zones **afin de** piloter la ville pilote.

**Priorité :** P0 · **Points :** 8

---

### US-E6-03 — Traiter litiges
**En tant qu’** admin, **je veux** décider remboursement **afin de** clore les conflits.

**Priorité :** P1 · **Points :** 5

---

## Epic E7 — Notifications

### US-E7-01 — Push statut mission
**En tant qu’** utilisateur, **je veux** recevoir des notifications **afin de** ne rien manquer.

**Événements :** pro trouvé, en route, terminé, nouvelle mission (pro)

**Priorité :** P1 · **Points :** 5

---

## Récap priorités

| Priorité | Signification | Stories |
|----------|---------------|---------|
| **P0** | Bloquant MVP launch | E1–E4, E6-01/02 |
| **P1** | Important launch | E5, E6-03, E7 |
| **P2** | Post-MVP | Abonnements, flottes B2B |

**Estimation totale P0 :** ~90 points (~8–10 sprints à 10 pts/sprint)

---

## Definition of Done (story)

- [ ] Code mergé sur `main` via PR review
- [ ] Tests unitaires / intégration passent
- [ ] Critères acceptation vérifiés
- [ ] Contrat API à jour si endpoint modifié
- [ ] Pas de régression lint/typecheck

---

→ [Checklist pré-dev](checklist-pre-developpement.md) · [Contrat API](api-contrat-v1.md)
