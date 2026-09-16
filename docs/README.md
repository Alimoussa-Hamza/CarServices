# Documentation CARSERVICE — Index

> Hub central de toutes les études et guides **à produire avant le développement**.

---

## Ordre de lecture recommandé

```
1. Produit & métier     → cahier des charges, règles de gestion, backlog MVP
2. Business             → business plan Y1, unit economics
3. UX / Design          → wireframes, spec Figma, guide UX
4. Architecture         → étude technique, ADR, schéma BDD, contrat API
5. Guides par couche    → API, mobile, admin, packages, infra, intégrations
6. Qualité & conformité → QA, sécurité RGPD
7. Go / No-Go           → checklist pré-développement
8. Développement        → standards de code, CONTRIBUTING
```

---

## Statut des livrables

| # | Document | Couche | Statut |
|---|----------|--------|--------|
| 1 | [Cahier des charges](cahier-des-charges.md) | Produit | ✅ Fait |
| 1b | [Cahier fermeture backend M15](cahier-fermeture-backend.md) | Backend | ✅ Fait |
| 2 | [Règles de gestion](regles-de-gestion.md) | Métier | ✅ Fait |
| 3 | [Backlog MVP](backlog-mvp.md) | Produit | ✅ Fait |
| 3b | [Backlog Jira (Epic→Task)](backlog-jira.md) | Produit / Dev | ✅ Fait |
| 3c | [Import CSV Jira](backlog/jira-import.csv) | Jira | ✅ Fait |
| 4 | [Business plan Y1](business-plan-y1.md) | Business | ✅ Fait |
| 5 | [Wireframes](wireframes.md) | UX | ✅ Fait |
| 6 | [Spec Figma](spec-figma.md) | Design | ✅ Fait |
| 7 | [Guide UX & parcours](guides/guide-ux-design.md) | UX | ✅ Fait |
| 8 | [Étude architecture](etude-architecture-technique.md) | Tech | ✅ Fait |
| 9 | [ADR](adr/README.md) | Tech | ✅ Fait |
| 10 | [Schéma BDD](schema-base-de-donnees.md) | Data | ✅ Fait |
| 11 | [Contrat API v1](api-contrat-v1.md) | API | ✅ Fait |
| 12 | [Guide API / Backend](guides/guide-api-backend.md) | API | ✅ Fait |
| 13 | [Guide Mobile Client](guides/guide-mobile-client.md) | Mobile | ✅ Fait |
| 14 | [Guide Mobile Pro](guides/guide-mobile-pro.md) | Mobile | ✅ Fait |
| 15 | [Guide Admin](guides/guide-admin.md) | Admin | ✅ Fait |
| 16 | [Guide packages partagés](guides/guide-packages-partages.md) | Shared | ✅ Fait |
| 17 | [Guide intégrations](guides/guide-integrations.md) | Intégrations | ✅ Fait |
| 18 | [Guide Infra & DevOps](guides/guide-infra-devops.md) | Infra | ✅ Fait |
| 19 | [Guide QA & tests](guides/guide-qa.md) | QA | ✅ Fait |
| 19b | [Cahier + matrice API](qa/README.md) | QA | ✅ Fait |
| 20 | [Guide sécurité & RGPD](guides/guide-securite-conformite.md) | Sécurité | ✅ Fait |
| 21 | [Checklist pré-développement](checklist-pre-developpement.md) | Go/No-Go | ✅ Fait |
| 22 | [Standards développement](standards-developpement.md) | Code | ✅ Fait |
| 22b | [Cahier bonnes pratiques UI](cahier-bonnes-pratiques-ui.md) | Design / Mobile | ✅ Fait |
| 23 | [Tech stack & docs officielles](tech-stack/README.md) | Tooling | ✅ Fait — **index complet liens** |
| 24 | [Skill IA dev + bugs](.cursor/skills/carservice-dev/SKILL.md) | Tooling | ✅ Fait |
| 25 | Maquettes Figma (.fig) | Design | ⏳ À faire |
| 24 | Monorepo initialisé | Code | ⏳ À faire |

---

## Arborescence

```
docs/
├── README.md                          ← vous êtes ici
├── checklist-pre-developpement.md
├── cahier-des-charges.md
├── regles-de-gestion.md
├── backlog-mvp.md
├── backlog-jira.md                 # Epic → Module → Story → Task
├── backlog/
│   └── jira-import.csv             # 315 issues import Jira
├── business-plan-y1.md
├── wireframes.md
├── spec-figma.md
├── etude-architecture-technique.md
├── schema-base-de-donnees.md
├── api-contrat-v1.md
├── qa/                                # Cahier de tests + matrice + procédures API
│   ├── README.md
│   ├── cahier-de-tests-api.md
│   ├── matrice-couverture-api.md
│   └── procedure-execution.md
├── standards-developpement.md
├── guides/
│   ├── guide-ux-design.md
│   ├── guide-api-backend.md
│   ├── guide-mobile-client.md
│   ├── guide-mobile-pro.md
│   ├── guide-admin.md
│   ├── guide-packages-partages.md
│   ├── guide-integrations.md
│   ├── guide-infra-devops.md
│   ├── guide-qa.md
│   └── guide-securite-conformite.md
└── adr/
    ├── README.md
    ├── 000-template.md
    ├── 001-monolithe-modulaire.md
    ├── 002-stack-typescript-unifiee.md
    ├── 003-stripe-connect-express.md
    └── 004-postgresql-postgis.md
```

---

## Qui lit quoi ?

| Rôle | Documents prioritaires |
|------|------------------------|
| **Product Owner** | CDC, RG, backlog, business plan, checklist |
| **Designer** | Wireframes, spec Figma, guide UX, copy deck |
| **Dev Backend** | Architecture, ADR, schéma BDD, contrat API, guide API, intégrations |
| **Dev Mobile** | Wireframes, spec Figma, guide mobile client/pro, contrat API, packages |
| **Dev Admin** | Wireframes A01–A09, guide admin, contrat API |
| **DevOps** | Guide infra, sécurité, intégrations |
| **QA** | [docs/qa/](qa/README.md), guide QA, RG, contrat API, Postman |
| **Juridique / DPO** | Guide sécurité RGPD, règles de gestion |
