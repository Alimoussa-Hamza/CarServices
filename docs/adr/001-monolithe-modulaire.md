# ADR-001 — Monolithe modulaire

## Statut
Accepté

## Contexte
CARSERVICE MVP nécessite API, matching, paiements, notifications avec une équipe de 1–3 devs et un time-to-market de 3–5 mois. Microservices multiplieraient la complexité ops sans charge utilisateur initiale.

## Options considérées
1. **Monolithe modulaire NestJS** — un déploiement, modules domaine
2. **Microservices** — services booking, payment, notify séparés
3. **Serverless** — Lambda par fonction

## Décision
Adopter un **monolithe modulaire** avec frontières strictes par module Nest (`bookings`, `payments`, etc.) et workers BullMQ dans le même repo.

Extraction en microservice possible ultérieurement si métriques le justifient (ex. `payments`).

## Conséquences
### Positives
- Debugging simple, déploiement unique
- Transactions DB booking + payment faciles
- Coût infra bas

### Négatives
- Scale horizontal = scale tout le monolithe
- Discipline requise pour ne pas créer couplage inter-modules

## Références
- [Étude architecture §2](../etude-architecture-technique.md)
