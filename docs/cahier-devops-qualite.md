# Cahier DevOps & Qualité — Module M16

> **Objectif :** industrialiser le déploiement API et figer la couche qualité repo (CI, Docker, runbooks), sans attendre les comptes stores/EAS.  
> **Références :** [guide-infra-devops.md](guides/guide-infra-devops.md) · [guide-qa.md](guides/guide-qa.md) · [docs/qa/](qa/README.md) · [suivi-taches.md](backlog/suivi-taches.md)

---

## 1. Contexte

Après **M15** (backend fermé) :

| Déjà livré (souvent via M15) | Gap restant |
|------------------------------|-------------|
| Pack QA `docs/qa/` + smoke + k6 | Dockerfile API / image déployable |
| Gates e2e M02–M15 + CI `e2e-api` | Playbook staging (Railway/Render) |
| Sentry + Pino + Helmet + Throttle | Runbook incident / release DoD |
| Postman contrat v1 | Sync backlog M14 (stories déjà faites) |

**Hors scope M16 (besoin comptes humains) :** EAS TestFlight/APK (CS-M14-S03), soumission stores (S05), SC manuels **sur** staging réel (S02), secrets prod Stripe live.

---

## 2. Non-objectifs

- Provisionner réellement Railway/Render (clés utilisateur)
- Builds mobiles EAS / App Store
- Monitoring SaaS payant (Better Stack) — documenter seulement

---

## 3. Exigences

### EF-01 Sync qualité M14

Cocher dans le suivi : S01 Postman, S07 cahier/matrice, S08 gates+smoke, S09 CI e2e (déjà sur `main`).

### EF-02 Image API Docker

- `apps/api/Dockerfile` multi-stage (Node 20, pnpm, Prisma generate, `nest build`)
- `.dockerignore` monorepo
- Healthcheck `GET /api/v1/health`
- Doc : build/run local

### EF-03 CI hardening

- Job `quality` : `pnpm lint` (api = typecheck si ESLint non câblé)
- Job `e2e-api` : env JWT/throttle + `THROTTLE_LIMIT` élevé
- Job optionnel `docker-api` : build image (no push)

### EF-04 Staging playbook

- `deploy/railway.toml` + `deploy/render.yaml` templates
- Checklist variables env + migrate + seed + smoke
- Mettre à jour guide-infra

### EF-05 Runbook + release

- `docs/runbooks/incident-api.md`
- `docs/runbooks/release-checklist.md`
- Critères GO/NOGO release API dans `docs/qa/procedure-execution.md`

---

## 4. Definition of Done

- [x] Stories S01–S05 cochées + commits Conventional Commits
- [x] `docker build` API documenté (+ job CI `docker-api`)
- [x] CI : quality (lint+typecheck+test+build) + e2e-api + docker-api
- [x] Piste Q M14 synchro (S01/S06/S07/S08/S09)
- [x] Piste S M16 5/5

> Provision cloud réelle (Railway/Render) et SC manuels staging restent manuels hors repo.

## 5. Stories

| ID | Contenu | Pts |
|----|---------|-----|
| CS-M16-S01 | Cahier + sync suivi M14 fait | 2 |
| CS-M16-S02 | Dockerfile API + ignore + doc | 5 |
| CS-M16-S03 | CI lint + docker build + harden e2e | 3 |
| CS-M16-S04 | Templates staging Railway/Render + playbook | 3 |
| CS-M16-S05 | Runbooks incident + release DoD | 3 |
