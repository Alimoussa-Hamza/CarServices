# CARSERVICE — Outils développement

## Vérification environnement Mac

**Important :** exécuter depuis le dossier projet, pas depuis `~` :

```bash
cd ~/Desktop/CARSERVICE
./tools/setup-dev.sh    # 1ère fois : Node 20 + pnpm 9
./tools/check-env.sh
```

### Problème fréquent : pnpm 11 + Node 20

Homebrew installe pnpm 11 qui **requiert Node ≥ 22**. Le projet utilise **Node 20 + pnpm 9** :

```bash
cd ~/Desktop/CARSERVICE
nvm use
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm -v   # doit afficher 9.15.x
```

Vérifie : macOS, Apple Silicon/Intel, Node, pnpm, Docker, Xcode CLI, ports, espace disque.

JSON (CI / agent) :
```bash
./tools/check-env.sh --json
```

## Assistant IA Cursor

**Skill :** `.cursor/skills/carservice-dev/SKILL.md`

Invoquer en chat :
```
@carservice-dev comment implémenter CS-M05-S04 matching ?
```

Ou mentionner : développement CARSERVICE, bug, setup env.

Contenu du skill :
- Workflow dev + standards
- [bug-resolution.md](../.cursor/skills/carservice-dev/bug-resolution.md)
- [dev-workflows.md](../.cursor/skills/carservice-dev/dev-workflows.md)

**Règle Cursor :** `.cursor/rules/carservice-agent.mdc` (always apply)

## Documentation stack

| Fichier | Contenu |
|---------|---------|
| [docs/tech-stack/README.md](../docs/tech-stack/README.md) | Liens docs officielles |
| [docs/tech-stack/versions.md](../docs/tech-stack/versions.md) | Versions + compat Mac |

## Ton Mac (dernière vérif)

Exécuter `./tools/check-env.sh` pour rapport à jour.
