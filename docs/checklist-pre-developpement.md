# Checklist pré-développement — CARSERVICE

> **Objectif :** valider que tout est prêt avant d’écrire la première ligne de code applicatif.  
> Cocher chaque item ; le projet ne démarre en dev qu’avec **≥ 90 % des items obligatoires** validés.

---

## Légende

- 🔴 **Bloquant** — indispensable avant dev
- 🟡 **Recommandé** — peut paralléliser semaine 1
- 🟢 **Optionnel MVP** — phase 2 acceptable

---

## 1. Produit & métier

| Statut | Item | Doc |
|--------|------|-----|
| 🔴 | Périmètre MVP lavage validé (IN/OUT) | [CDC](cahier-des-charges.md) |
| 🔴 | Règles de gestion métier documentées | [RG](regles-de-gestion.md) |
| 🔴 | User stories MVP avec critères d’acceptation | [Backlog](backlog-mvp.md) |
| 🔴 | Ville pilote choisie | — |
| 🔴 | Grille tarifaire pilote (4 formules + options) | [Backlog](backlog-mvp.md) |
| 🟡 | Business plan Y1 / unit economics | [Business plan](business-plan-y1.md) |
| 🟡 | Personas client + pro définis | [Guide UX](guides/guide-ux-design.md) |
| 🟢 | Roadmap post-MVP (phases 1–4) | [CDC §11](cahier-des-charges.md) |

---

## 2. UX & Design

| Statut | Item | Doc |
|--------|------|-----|
| 🔴 | Wireframes écrans prioritaires (C03–C11, P02–P05) | [Wireframes](wireframes.md) |
| 🔴 | Design system / tokens définis | [Spec Figma](spec-figma.md) |
| 🔴 | Parcours client + pro cartographiés | [Guide UX](guides/guide-ux-design.md) |
| 🔴 | Copy deck FR (textes écrans) | [Guide UX](guides/guide-ux-design.md) |
| 🟡 | Maquettes Figma haute fidélité | Figma (externe) |
| 🟡 | Prototype cliquable validé PO | Figma |
| 🟢 | Tests utilisateurs (5–8 interviews) | — |

---

## 3. Architecture & données

| Statut | Item | Doc |
|--------|------|-----|
| 🔴 | Stack technique validée | [Architecture](etude-architecture-technique.md) |
| 🔴 | ADR principales rédigées | [ADR](adr/README.md) |
| 🔴 | Schéma BDD v1 complet | [Schéma BDD](schema-base-de-donnees.md) |
| 🔴 | Contrat API v1 (endpoints + payloads) | [API v1](api-contrat-v1.md) |
| 🔴 | State machine booking formalisée | [RG §4](regles-de-gestion.md) |
| 🟡 | Diagramme composants infra | [Guide Infra](guides/guide-infra-devops.md) |
| 🟢 | Plan extraction microservices | [Architecture §2](etude-architecture-technique.md) |

---

## 4. Guides par couche (pré-dev)

| Statut | Item | Doc |
|--------|------|-----|
| 🔴 | Guide API / Backend | [Guide API](guides/guide-api-backend.md) |
| 🔴 | Guide Mobile Client | [Guide Client](guides/guide-mobile-client.md) |
| 🔴 | Guide Mobile Pro | [Guide Pro](guides/guide-mobile-pro.md) |
| 🔴 | Guide Admin | [Guide Admin](guides/guide-admin.md) |
| 🔴 | Guide packages partagés | [Guide packages](guides/guide-packages-partages.md) |
| 🔴 | Guide intégrations tierces | [Intégrations](guides/guide-integrations.md) |
| 🔴 | Guide Infra & DevOps | [Infra](guides/guide-infra-devops.md) |
| 🔴 | Guide QA & tests | [QA](guides/guide-qa.md) |
| 🔴 | Guide sécurité & RGPD | [Sécurité](guides/guide-securite-conformite.md) |
| 🔴 | Standards de code | [Standards](standards-developpement.md) |

---

## 5. Intégrations & comptes

| Statut | Item | Doc |
|--------|------|-----|
| 🔴 | Compte Stripe Connect (mode test) | [Intégrations](guides/guide-integrations.md) |
| 🔴 | Compte cloud (Railway/Render/Scaleway) | [Infra](guides/guide-infra-devops.md) |
| 🔴 | PostgreSQL managé provisionné | [Infra](guides/guide-infra-devops.md) |
| 🔴 | Object storage EU (Scaleway/R2) | [Intégrations](guides/guide-integrations.md) |
| 🟡 | Google Maps Platform (clé + quotas) | [Intégrations](guides/guide-integrations.md) |
| 🟡 | SMS OTP (Twilio/Brevo) | [Intégrations](guides/guide-integrations.md) |
| 🟡 | Email transactionnel (Brevo/Resend) | [Intégrations](guides/guide-integrations.md) |
| 🟡 | Sentry projet créé | [Infra](guides/guide-infra-devops.md) |
| 🟡 | Apple Developer + Google Play Console | — |
| 🟢 | PostHog analytics | [Infra](guides/guide-infra-devops.md) |

---

## 6. Légal & conformité

| Statut | Item | Doc |
|--------|------|-----|
| 🔴 | CGU / CGV rédigées (brouillon avocat) | [Sécurité](guides/guide-securite-conformite.md) |
| 🔴 | Politique confidentialité (RGPD) | [Sécurité](guides/guide-securite-conformite.md) |
| 🔴 | Mentions légales plateforme | [Sécurité](guides/guide-securite-conformite.md) |
| 🟡 | DPA sous-traitants (Stripe, hébergeur) | [Sécurité](guides/guide-securite-conformite.md) |
| 🟡 | Registre traitements RGPD | [Sécurité](guides/guide-securite-conformite.md) |
| 🟡 | Charte environnementale pros (lavage éco) | [RG-CAT-04](regles-de-gestion.md) |

---

## 7. Équipe & process

| Statut | Item | Doc |
|--------|------|-----|
| 🔴 | Repo Git + accès équipe | — |
| 🔴 | Workflow Git / PR défini | [CONTRIBUTING](../CONTRIBUTING.md) |
| 🟡 | Board tickets (Linear/Jira/GitHub Projects) | Backlog importé |
| 🟡 | Environnements local / staging / prod nommés | [Infra](guides/guide-infra-devops.md) |
| 🟡 | Definition of Done équipe | [Guide QA](guides/guide-qa.md) |
| 🟢 | Runbook incident | Phase post-launch |

---

## 8. Go / No-Go — décision

### Critères Go (tous requis)

- [ ] Périmètre MVP figé et signé PO
- [ ] Wireframes + contrat API + schéma BDD validés par dev lead
- [ ] Comptes Stripe test + DB staging opérationnels
- [ ] Guides par couche lus par chaque dev
- [ ] Ville pilote + tarifs configurables en admin (spec)

### Critères No-Go (report dev)

- Périmètre encore mouvant (ex. ajout mécanique au MVP)
- Pas de décision paiement (Stripe Connect)
- Pas de schéma booking / state machine
- Pas de textes légaux minimum

---

## 9. Planning semaine 0 (kick-off dev)

| Jour | Action |
|------|--------|
| J1 | Init monorepo, CI, `.env.example`, Prisma schema |
| J2 | Module auth OTP + users (skeleton) |
| J3 | Module catalog + zones (seed Lyon) |
| J4 | Stripe Connect test + webhook local (ngrok) |
| J5 | Scaffold Expo Client + Admin login |

---

## Sign-off

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Designer | | | |

---

→ Retour [Index documentation](README.md)
