# ADR-004 — PostgreSQL + PostGIS

## Statut
Accepté

## Contexte
Besoins : transactions ACID (bookings + payments), zones géographiques polygones, snapshots JSON, relations complexes.

## Options considérées
1. **PostgreSQL + PostGIS**
2. **MySQL**
3. **MongoDB**

## Décision
**PostgreSQL 16+** avec extension **PostGIS** pour zones et distance matching.

ORM : **Prisma** (migrations, typage).

## Conséquences
### Positives
- Fiabilité transactionnelle
- JSONB pour pricing snapshots
- Geo queries natives

### Négatives
- PostGIS requiert migrations raw occasionnelles
- Prisma support geo limité → `$queryRaw` pour distance

## Références
- [Schéma BDD](../schema-base-de-donnees.md)
