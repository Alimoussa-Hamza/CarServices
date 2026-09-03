# CARSERVICE

Marketplace de services auto à domicile — **MVP : lavage véhicule (sans eau / vapeur)**.

## Vision

Mettre en relation clients et professionnels pour des prestations auto à domicile, en commençant par le lavage, avec une architecture prête à accueillir d'autres catégories (batterie, pneus, diagnostic, etc.).

---

## Démarrer — ordre recommandé

1. **[Index documentation](docs/README.md)** — hub central
2. **[Checklist pré-développement](docs/checklist-pre-developpement.md)** — Go/No-Go avant code
3. Guides par couche (ci-dessous)
4. **[Standards de développement](docs/standards-developpement.md)** — une fois le dev lancé

---

## Documentation complète

### Produit & business
| Document | Description |
|----------|-------------|
| [Cahier des charges](docs/cahier-des-charges.md) | Périmètre MVP, specs écrans |
| [Règles de gestion](docs/regles-de-gestion.md) | RG métier (pricing, matching, KYC…) |
| [Backlog MVP (stories)](docs/backlog-mvp.md) | User stories + critères acceptation |
| [Backlog Jira (Epic→Task)](docs/backlog-jira.md) | 14 epics, 104 stories, 197 tasks, 12 sprints |
| [Import CSV Jira](docs/backlog/jira-import.csv) | Fichier import Jira (315 issues) |
| [Business plan Y1](docs/business-plan-y1.md) | Unit economics, KPIs |
| [Tech stack & docs officielles](docs/tech-stack/README.md) | **Index complet liens doc par techno** |
| [Versions & compat Mac](docs/tech-stack/versions.md) | Matrice versions |

### UX & design
| Document | Description |
|----------|-------------|
| [Wireframes](docs/wireframes.md) | Layout écrans C03–C11, P02–P05 |
| [Spec Figma](docs/spec-figma.md) | Design system, composants |
| [Guide UX & copy](docs/guides/guide-ux-design.md) | Personas, parcours, textes FR |

### Architecture & données
| Document | Description |
|----------|-------------|
| [Étude architecture](docs/etude-architecture-technique.md) | Stack, comparatif techno |
| [ADR](docs/adr/README.md) | Décisions architecture |
| [Schéma BDD](docs/schema-base-de-donnees.md) | Modèle PostgreSQL |
| [Contrat API v1](docs/api-contrat-v1.md) | Endpoints REST |

### Guides par couche (pré-dev)
| Document | Couche |
|----------|--------|
| [Guide API / Backend](docs/guides/guide-api-backend.md) | NestJS, modules, jobs |
| [Guide Mobile Client](docs/guides/guide-mobile-client.md) | Expo app client |
| [Guide Mobile Pro](docs/guides/guide-mobile-pro.md) | Expo app pro |
| [Guide Admin](docs/guides/guide-admin.md) | Next.js back-office |
| [Guide packages partagés](docs/guides/guide-packages-partages.md) | shared-types, api-client |
| [Guide intégrations](docs/guides/guide-integrations.md) | Stripe, Maps, SMS… |
| [Guide Infra & DevOps](docs/guides/guide-infra-devops.md) | CI/CD, déploiement |
| [Guide QA & tests](docs/guides/guide-qa.md) | Stratégie tests, scénarios |
| [Guide sécurité & RGPD](docs/guides/guide-securite-conformite.md) | Conformité, sécurité |

### Développement (pendant implémentation)
| Document | Description |
|----------|-------------|
| [Standards de développement](docs/standards-developpement.md) | Conventions code, Git, format |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Workflow contribution |

### Outils IA & environnement
| Outil | Description |
|-------|-------------|
| [Skill Cursor dev + bugs](.cursor/skills/carservice-dev/SKILL.md) | Assistant IA : comment dev, standards, debug |
| [Règle agent](.cursor/rules/carservice-agent.mdc) | Contexte auto pour Cursor |
| [`./tools/check-env.sh`](tools/check-env.sh) | Vérif Mac + versions stack |
| [tools/README.md](tools/README.md) | Guide outils |

**Invoquer le skill :** `@carservice-dev` dans le chat Cursor.

---

## Stack recommandée (MVP)

| Couche | Choix |
|--------|-------|
| Architecture | Monolithe modulaire |
| Mobile | React Native + Expo (Client + Pro) |
| Admin | Next.js + shadcn/ui |
| API | NestJS + Prisma |
| DB | PostgreSQL + PostGIS |
| Paiement | Stripe Connect Express |

Détails : [étude architecture](docs/etude-architecture-technique.md)

---

## Phase actuelle

- [x] Documentation pré-développement (produit, UX, archi, guides couche)
- [x] Standards de code
- [x] Skill IA dev + check-env Mac
- [ ] Checklist pré-dev signée (Go)
- [ ] Maquettes Figma finalisées
- [ ] Init monorepo
- [ ] MVP 1 ville pilote
