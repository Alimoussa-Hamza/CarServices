---
name: carservice-dev
description: >-
  Assistant développement CARSERVICE — standards code, résolution bugs, doc
  stack, vérification versions et compatibilité Mac. Use when developing,
  fixing bugs, setting up environment, choosing libraries, or asking how to
  implement features in this project.
---

# CARSERVICE — Assistant développement IA

Tu es l’agent de développement du projet **CARSERVICE** (marketplace lavage auto à domicile). Suis ce skill **à chaque session de dev ou debug**.

## Démarrage obligatoire (avant tout code)

1. Exécuter `./tools/check-env.sh` — corriger erreurs avant de continuer
2. Lire [docs/tech-stack/versions.md](../../docs/tech-stack/versions.md) pour versions épinglées
3. Identifier le **module backlog** (M00–M14) et la **story** concernée dans [docs/backlog-jira.md](../../docs/backlog-jira.md)

## Hiérarchie documentaire

| Priorité | Document | Quand |
|----------|----------|-------|
| 1 | [regles-de-gestion.md](../../docs/regles-de-gestion.md) | Logique métier (pricing, booking, KYC) |
| 2 | [api-contrat-v1.md](../../docs/api-contrat-v1.md) | Endpoints, payloads |
| 3 | [standards-developpement.md](../../docs/standards-developpement.md) | Format code, Git, structure |
| 4 | Guide couche ([guides/](../../docs/guides/)) | API / mobile / admin |
| 5 | [tech-stack/README.md](../../docs/tech-stack/README.md) | Docs officielles techno |

**Règle absolue :** la logique métier (state machine booking, pricing, matching) vit **uniquement dans `apps/api`**. Jamais côté mobile.

## Workflow développement feature

```
1. Trouver story CS-Mxx-Sxx dans backlog-jira.md
2. Lire critères acceptation + RG associées
3. Vérifier contrat API (ajouter endpoint si manquant → doc d’abord)
4. Implémenter : shared-types → api → api-client → app consommatrice
5. Tests obligatoires pour tout nouveau développement (unitaires ou intégration selon le risque)
6. lint + typecheck + test
7. PR Conventional Commits (scope: api|mobile-client|mobile-provider|admin)
```

### Ordre implémentation cross-stack

```
packages/shared-types  →  apps/api  →  packages/api-client  →  mobile/admin
```

## Conventions non négociables

- TypeScript **strict**, pas de `any`
- Schémas **Zod** dans `@carservice/shared-types`
- Commits : `feat(api): ...` / `fix(mobile-client): ...`
- PR < 400 lignes, 1 feature
- UI **français**, code **anglais**
- Pas de secrets dans le repo
- Toute nouvelle feature/fix doit ajouter ou mettre à jour ses tests avant d'être cochée comme faite

## Tests obligatoires

- Nouveau code métier API : tests unitaires au minimum ; intégration si DB, Redis, HTTP ou webhook.
- Nouveau schéma Zod : tests parse valide/invalide dans `packages/shared-types`.
- Nouveau client API : tests wrapper, succès, erreurs et auth headers dans `packages/api-client`.
- Nouveau composant/hook mobile/admin critique : test du comportement utilisateur ou du hook.
- Toujours lancer `pnpm test` avant de déclarer une tâche terminée ; lancer aussi `pnpm build` si des fichiers TS/app ont changé.
- Si aucun test n'est ajouté, expliquer explicitement la raison.

## Quelle doc officielle consulter ?

**Index complet (toutes les technos + liens) :** [docs/tech-stack/README.md](../../docs/tech-stack/README.md)

Exemples rapides :

| Tâche | Doc |
|-------|-----|
| Module Nest guard | https://docs.nestjs.com/guards |
| Prisma migration | https://www.prisma.io/docs/orm/prisma-migrate |
| Expo Router screen | https://docs.expo.dev/router/introduction/ |
| Stripe Connect | https://docs.stripe.com/connect |
| PostGIS query | https://postgis.net/docs/ST_DWithin.html |
| TanStack Query | https://tanstack.com/query/latest/docs/framework/react/overview |
| shadcn/ui | https://ui.shadcn.com/docs |

## Résolution de bugs

Suivre [bug-resolution.md](bug-resolution.md) — **ne jamais patcher sans repro et cause racine**.

Résumé :
1. Reproduire (steps + env)
2. Classifier : `S1` bloquant prod · `S2` feature cassée · `S3` mineur
3. Localiser couche (API / mobile / admin / infra)
4. Vérifier RG métier non violée
5. Fix minimal + test régression
6. Commit `fix(scope): ...`

## Modules → apps

| Module | App / package |
|--------|---------------|
| M00–M01 | monorepo, packages/ |
| M02–M10 | apps/api |
| M11 | apps/mobile-client |
| M12 | apps/mobile-provider |
| M13 | apps/admin |
| M14 | QA, tools/, CI |

## Anti-patterns interdits

- Pricing ou transition statut booking côté client
- Endpoint sans schema Zod shared-types
- Migration Prisma editée après merge
- `console.log` en prod (utiliser Pino / Sentry)
- Bypass KYC guard pour "test rapide" en staging public

## Checklist avant merge

- [ ] `./tools/check-env.sh` OK (ou CI équivalent)
- [ ] `pnpm lint && pnpm typecheck && pnpm test`
- [ ] RG métier respectées
- [ ] Contrat API / backlog à jour si changement
- [ ] Pas de régression IDOR / auth

## Ressources détaillées

- [bug-resolution.md](bug-resolution.md) — process bugs complet
- [dev-workflows.md](dev-workflows.md) — scénarios par couche
