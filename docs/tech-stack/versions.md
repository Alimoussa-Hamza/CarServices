# Matrice de versions — CARSERVICE

> **Dernière revue :** 2026-08-26  
> **Plateforme dev :** macOS Apple Silicon (arm64) · macOS Intel supporté

---

## Versions épinglées (monorepo)

| Techno | Version cible | Min | Max testé | Notes |
|--------|---------------|-----|-----------|-------|
| **Node.js** | **20 LTS** | 20.11 | 20.x | `.nvmrc` = 20 — **ne pas utiliser `system` Node** |
| **pnpm** | **9.15.x** | 9.0 | 9.x | **Avec Node 20** via `corepack prepare pnpm@9.15.4` |
| **TypeScript** | **5.7.x** | 5.5 | 5.8 | strict mode |
| **Turbo** | **2.x** | 2.0 | latest | Monorepo |
| **NestJS** | **11.x** | 11.0 | latest | Node ≥ 20 |
| **Prisma** | **6.x** | 6.0 | latest | PostgreSQL 14+ |
| **PostgreSQL** | **16** | 14 | 17 | + PostGIS 3.4 |
| **PostGIS** | **3.4** | 3.3 | latest | Extension geo |
| **Redis** | **7.x** | 7.0 | 7.4 | BullMQ |
| **Next.js** | **15.x** | 15.0 | latest | App Router |
| **React** | **19.x** | 18.3 | 19.x | RN + Next |
| **Expo SDK** | **52** | 52 | 53 | RN 0.76 |
| **React Native** | **0.76.x** | 0.76 | via Expo | Managed workflow |
| **Stripe** | **API 2024-11-20.acacia** | — | — | SDK `@stripe/stripe-js` latest |
| **Zod** | **3.23+** | 3.22 | 3.x | shared-types |
| **TanStack Query** | **5.x** | 5.0 | latest | Mobile + admin |

---

## Compatibilité macOS (dev local)

| Composant | Apple Silicon (M1–M4) | Intel Mac | Prérequis |
|-----------|----------------------|-----------|-----------|
| Node / pnpm | ✅ Natif | ✅ | nvm recommandé |
| Docker Desktop | ✅ | ✅ | 4.x+, allocate 4GB+ RAM |
| PostgreSQL Docker | ✅ arm64 image | ✅ | `postgis/postgis:16-3.4` |
| Redis Docker | ✅ | ✅ | `redis:7-alpine` |
| Expo / iOS Simulator | ✅ | ✅ | Xcode 15+ |
| Expo / Android Emulator | ✅ | ✅ | Android Studio |
| NestJS API | ✅ | ✅ | — |
| Next.js admin | ✅ | ✅ | — |

### macOS minimum
- **macOS 14 Sonoma** recommandé (Xcode 15)
- **macOS 15+** : OK (testé arm64)
- **RAM** : 16 GB recommandé (8 GB minimum avec Docker limité)
- **Disque** : 20 GB libres (node_modules + Docker + simulateurs)

---

## Matrice compatibilité inter-packages

| Package A | Package B | Statut | Note |
|---------|-----------|--------|------|
| NestJS 11 | Node 20 | ✅ | Requis |
| NestJS 11 | Node 24 | ⚠️ | Dev OK, CI sur 20 LTS |
| Prisma 6 | PostgreSQL 16 | ✅ | |
| Prisma 6 | PostGIS | ✅ | Raw queries geo |
| Expo 52 | React 19 | ✅ | Via RN 0.76 |
| Expo 52 | Node 20+ | ✅ | |
| Next 15 | React 19 | ✅ | |
| BullMQ | Redis 7 | ✅ | |
| Stripe RN SDK | Expo 52 | ✅ | Dev client si natif |
| `@nestjs/config` | Zod env | ✅ | Validation boot |

---

## Vérification automatique

```bash
chmod +x tools/check-env.sh
./tools/check-env.sh
```

Sortie JSON (CI / agent IA) :
```bash
./tools/check-env.sh --json
```

---

## Mise à jour des versions

1. Modifier ce fichier + `.nvmrc` + `package.json` engines
2. Lancer `./tools/check-env.sh`
3. `pnpm install && pnpm build && pnpm test`
4. Mettre à jour ADR si changement majeur

---

→ [Index documentation officielle](README.md)
