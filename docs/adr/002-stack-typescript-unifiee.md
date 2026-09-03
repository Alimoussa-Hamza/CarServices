# ADR-002 — Stack TypeScript unifiée

## Statut
Accepté

## Contexte
Trois surfaces : API, 2 apps mobile, admin web. Partage de types et validation souhaité entre couches.

## Options considérées
1. **NestJS + Expo + Next.js** (TypeScript)
2. **Laravel + Expo + Next.js** (PHP + TS)
3. **NestJS + Flutter** (TS + Dart)

## Décision
Stack **100 % TypeScript** côté applicatif :
- API : NestJS
- Mobile : React Native + Expo
- Admin : Next.js
- Shared : Zod schemas dans `packages/shared-types`

## Conséquences
### Positives
- Types partagés, une compétence langage
- Recrutement dev fullstack JS facilité

### Négatives
- Pas Filament (admin Laravel rapide)
- Nest plus verbeux que Laravel solo

## Références
- [Standards développement](../standards-developpement.md)
