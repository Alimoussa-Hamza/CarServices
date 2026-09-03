# ADR-005 — React Native Expo — deux applications

## Statut
Accepté

## Contexte
Deux personas mobile distincts (client vs pro) avec parcours, permissions et stores différents.

## Options considérées
1. **2 apps Expo** (`mobile-client`, `mobile-provider`)
2. **1 app avec switch rôle**
3. **Flutter 2 apps**

## Décision
**Deux applications Expo séparées** partageant packages `shared-types`, `api-client`, `ui-tokens`.

Bundle IDs :
- `fr.carservice.client`
- `fr.carservice.provider`

## Conséquences
### Positives
- Stores clairs ("CARSERVICE" vs "CARSERVICE Pro")
- Permissions et onboarding adaptés
- Release cycles indépendants possible

### Négatives
- 2× build/store maintenance
- Duplication UI partielle (mitigée par packages)

## Références
- [Guide mobile client](../guides/guide-mobile-client.md)
- [Guide mobile pro](../guides/guide-mobile-pro.md)
