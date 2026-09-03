# Contributing — CARSERVICE

## Avant de coder

1. Lire l’**[index documentation](docs/README.md)**
2. Valider la **[checklist pré-développement](docs/checklist-pre-developpement.md)**
3. Lire le **guide de ta couche** :
   - Backend → [guide-api-backend.md](docs/guides/guide-api-backend.md)
   - Mobile Client → [guide-mobile-client.md](docs/guides/guide-mobile-client.md)
   - Mobile Pro → [guide-mobile-pro.md](docs/guides/guide-mobile-pro.md)
   - Admin → [guide-admin.md](docs/guides/guide-admin.md)
   - Infra → [guide-infra-devops.md](docs/guides/guide-infra-devops.md)

## Pendant le développement

**[Standards de développement](docs/standards-developpement.md)** — conventions code, Git, format.

## Assistant IA Cursor

Skill projet : `.cursor/skills/carservice-dev/SKILL.md`

```
@carservice-dev comment implémenter CS-M05-S04 ?
```

Vérifier l'environnement Mac :
```bash
./tools/check-env.sh
```

```bash
nvm use
pnpm install
cp apps/api/.env.example apps/api/.env
docker compose up -d
pnpm dev
```

## Workflow Git

1. Branche `feature/CS-xxx-description` ou `fix/CS-xxx-description`
2. Commits [Conventional Commits](https://www.conventionalcommits.org/)
3. `pnpm lint && pnpm test && pnpm build`
4. PR vers `main` + review

## Scopes commit

`api` · `admin` · `mobile-client` · `mobile-provider` · `shared-types` · `infra` · `docs`
