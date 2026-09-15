# Schéma base de données — CARSERVICE

> PostgreSQL — modèle évolutif multi-services. MVP : catégorie `wash` uniquement.

---

## 1. Vue d'ensemble

```
users ──┬── client_profiles
        ├── provider_profiles ── provider_capabilities
        │                    └── provider_zones
        └── admin_users

service_categories ── service_offers ── offer_options
                    └── offer_checklists

service_zones ── zone_pricing

bookings ── booking_items ── booking_photos
         ├── booking_status_history
         ├── payments
         ├── reviews
         └── disputes

provider_kyc_documents
notifications
out_of_zone_leads
platform_config
```

---

## 2. Tables détaillées

### 2.1 Utilisateurs

#### `users`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| phone | VARCHAR(20) | UNIQUE, NOT NULL |
| email | VARCHAR(255) | UNIQUE, nullable |
| password_hash | VARCHAR(255) | nullable (OTP-only MVP) |
| role | ENUM | `client`, `provider`, `admin` |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

#### `client_profiles`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users, UNIQUE |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| default_address_id | UUID | FK → addresses, nullable |

#### `provider_profiles`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users, UNIQUE |
| company_name | VARCHAR(255) | |
| siret | VARCHAR(14) | UNIQUE |
| iban | VARCHAR(34) | chiffré |
| bio | TEXT | |
| avatar_url | VARCHAR(500) | |
| kyc_status | ENUM | `draft`, `submitted`, `approved`, `rejected` |
| kyc_rejection_reason | TEXT | nullable |
| wash_methods | ENUM[] | `waterless`, `steam` |
| rating_avg | DECIMAL(3,2) | DEFAULT 0 |
| rating_count | INT | DEFAULT 0 |
| acceptance_rate | DECIMAL(5,2) | DEFAULT 100 |
| stripe_account_id | VARCHAR(255) | nullable, UNIQUE |
| charges_enabled | BOOLEAN | DEFAULT false |
| base_address_id | UUID | FK → addresses |
| created_at | TIMESTAMPTZ | NOT NULL |

#### `provider_kyc_documents`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| provider_id | UUID | FK → provider_profiles |
| doc_type | ENUM | `rc_pro`, `identity`, `other` |
| file_url | VARCHAR(500) | |
| expires_at | DATE | nullable |
| verified_at | TIMESTAMPTZ | nullable |
| verified_by | UUID | FK → users (admin), nullable |

---

### 2.2 Adresses & zones

#### `addresses`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users, nullable |
| label | VARCHAR(100) | ex. "Domicile" |
| street | VARCHAR(255) | |
| complement | VARCHAR(255) | nullable |
| city | VARCHAR(100) | |
| postal_code | VARCHAR(10) | |
| country | CHAR(2) | DEFAULT 'FR' |
| lat | DECIMAL(10,7) | |
| lng | DECIMAL(10,7) | |
| instructions | TEXT | nullable |

#### `service_zones`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | ex. "Lyon centre" |
| slug | VARCHAR(100) | UNIQUE |
| polygon | GEOGRAPHY(POLYGON) | PostGIS |
| is_active | BOOLEAN | DEFAULT false |
| price_coefficient | DECIMAL(4,2) | DEFAULT 1.00 |
| min_booking_lead_hours | INT | DEFAULT 2 |
| created_at | TIMESTAMPTZ | NOT NULL |

#### `provider_zones`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| provider_id | UUID | FK → provider_profiles |
| zone_id | UUID | FK → service_zones |
| radius_km | DECIMAL(5,2) | nullable |
| | | PK (provider_id, zone_id) |

---

### 2.3 Catalogue

#### `service_categories`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| slug | VARCHAR(50) | UNIQUE, ex. `wash` |
| name | VARCHAR(100) | |
| description | TEXT | |
| icon | VARCHAR(100) | |
| is_enabled | BOOLEAN | DEFAULT false |
| sort_order | INT | DEFAULT 0 |

#### `service_offers`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| category_id | UUID | FK → service_categories |
| slug | VARCHAR(100) | UNIQUE |
| name | VARCHAR(150) | |
| description | TEXT | |
| base_price_cents | INT | NOT NULL |
| duration_minutes | INT | NOT NULL |
| form_schema | JSONB | champs dynamiques par offre |
| checklist_template | JSONB | items checklist pro |
| is_active | BOOLEAN | DEFAULT true |
| sort_order | INT | DEFAULT 0 |

**Exemple `form_schema` :**

```json
{
  "fields": [
    { "key": "vehicle_type", "type": "select", "required": true,
      "options": ["citadine", "berline", "suv", "utilitaire"] },
    { "key": "dirt_level", "type": "select", "required": false,
      "options": ["light", "normal", "heavy"] }
  ]
}
```

#### `offer_options`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| offer_id | UUID | FK → service_offers |
| slug | VARCHAR(100) | |
| name | VARCHAR(150) | |
| price_delta_cents | INT | DEFAULT 0 |
| duration_delta_minutes | INT | DEFAULT 0 |
| is_active | BOOLEAN | DEFAULT true |

#### `zone_pricing`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| zone_id | UUID | FK → service_zones |
| offer_id | UUID | FK → service_offers |
| price_override_cents | INT | nullable (sinon base_price) |
| vehicle_surcharges | JSONB | ex. `{"suv": 1000, "utilitaire": 1500}` |

#### `provider_capabilities`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| provider_id | UUID | FK → provider_profiles |
| offer_id | UUID | FK → service_offers |
| is_active | BOOLEAN | DEFAULT true |
| | | PK (provider_id, offer_id) |

---

### 2.4 Véhicules client

#### `client_vehicles`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| client_id | UUID | FK → client_profiles |
| label | VARCHAR(100) | ex. "Ma Clio" |
| vehicle_type | ENUM | `citadine`, `berline`, `suv`, `utilitaire`, `moto` |
| plate | VARCHAR(20) | nullable |
| color | VARCHAR(50) | nullable |

---

### 2.5 Réservations

#### `bookings`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| reference | VARCHAR(20) | UNIQUE, ex. "CS-20260901-ABC" |
| client_id | UUID | FK → client_profiles |
| provider_id | UUID | FK → provider_profiles, nullable |
| category_slug | VARCHAR(50) | snapshot, ex. `wash` |
| status | ENUM | voir RG-BOOK |
| address_snapshot | JSONB | NOT NULL |
| slot_start | TIMESTAMPTZ | NOT NULL |
| slot_end | TIMESTAMPTZ | NOT NULL |
| pricing_snapshot | JSONB | NOT NULL |
| commission_rate | DECIMAL(4,2) | snapshot |
| client_comment | TEXT | nullable |
| provider_notes | TEXT | nullable |
| zone_id | UUID | FK → service_zones |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

#### `booking_items`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| booking_id | UUID | FK → bookings |
| offer_id | UUID | FK → service_offers |
| offer_name | VARCHAR(150) | snapshot |
| vehicle_type | VARCHAR(50) | |
| options_snapshot | JSONB | |
| form_data | JSONB | réponses champs dynamiques |
| unit_price_cents | INT | |
| total_price_cents | INT | |

#### `booking_status_history`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| booking_id | UUID | FK → bookings |
| from_status | VARCHAR(50) | nullable |
| to_status | VARCHAR(50) | NOT NULL |
| actor_type | ENUM | `client`, `provider`, `admin`, `system` |
| actor_id | UUID | nullable |
| reason | TEXT | nullable |
| created_at | TIMESTAMPTZ | NOT NULL |

#### `booking_photos`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| booking_id | UUID | FK → bookings |
| uploaded_by | ENUM | `client`, `provider` |
| photo_type | ENUM | `before`, `after`, `issue` |
| file_url | VARCHAR(500) | |
| created_at | TIMESTAMPTZ | NOT NULL |

---

### 2.6 Paiements

#### `payments`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| booking_id | UUID | FK → bookings, UNIQUE |
| stripe_payment_intent_id | VARCHAR(255) | UNIQUE |
| amount_cents | INT | NOT NULL |
| commission_cents | INT | NOT NULL (RG-PAY-03) |
| provider_net_cents | INT | NOT NULL (RG-PAY-03) |
| currency | CHAR(3) | DEFAULT `EUR` |
| status | ENUM | `authorized`, `captured`, `refunded`, `failed` |
| captured_at | TIMESTAMPTZ | nullable |
| refunded_at | TIMESTAMPTZ | nullable |
| created_at | TIMESTAMPTZ | NOT NULL |

#### `stripe_events`

Idempotence webhooks Stripe (CS-M06-S04).

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| stripe_event_id | VARCHAR(255) | UNIQUE |
| event_type | VARCHAR(100) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

---

### 2.7 Avis & litiges

#### `reviews`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| booking_id | UUID | FK → bookings, UNIQUE |
| client_id | UUID | FK → client_profiles |
| provider_id | UUID | FK → provider_profiles |
| rating | SMALLINT | 1–5 |
| comment | TEXT | nullable |
| tags | VARCHAR(50)[] | ex. `["ponctualite", "qualite"]` |
| is_hidden | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | NOT NULL |

#### `disputes`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| booking_id | UUID | FK → bookings |
| opened_by | ENUM | `client`, `provider` |
| reason | ENUM | `quality`, `delay`, `damage`, `no_show`, `other` |
| description | TEXT | |
| status | ENUM | `open`, `under_review`, `resolved_client`, `resolved_provider`, `resolved_split`, `closed` |
| resolution_notes | TEXT | nullable |
| resolved_by | UUID | FK → users (admin), nullable |
| resolved_at | TIMESTAMPTZ | nullable |
| created_at | TIMESTAMPTZ | NOT NULL |

---

### 2.8 Disponibilités pro

#### `provider_availability`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| provider_id | UUID | FK → provider_profiles |
| day_of_week | SMALLINT | 0=dim … 6=sam |
| start_time | TIME | |
| end_time | TIME | |
| is_active | BOOLEAN | DEFAULT true |

#### `provider_blocked_slots`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| provider_id | UUID | FK → provider_profiles |
| start_at | TIMESTAMPTZ | |
| end_at | TIMESTAMPTZ | |
| reason | VARCHAR(255) | nullable |

---

### 2.9 Notifications & leads

#### `notifications`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| type | VARCHAR(100) | |
| title | VARCHAR(255) | |
| body | TEXT | |
| data | JSONB | payload (booking_id, etc.) |
| read_at | TIMESTAMPTZ | nullable |
| created_at | TIMESTAMPTZ | NOT NULL |

#### `out_of_zone_leads`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PK |
| email | VARCHAR(255) | nullable |
| phone | VARCHAR(20) | nullable |
| address_text | TEXT | |
| lat | DECIMAL(10,7) | |
| lng | DECIMAL(10,7) | |
| created_at | TIMESTAMPTZ | NOT NULL |

---

### 2.10 Configuration plateforme

#### `platform_config`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| key | VARCHAR(100) | PK |
| value | JSONB | |
| updated_at | TIMESTAMPTZ | NOT NULL |

**Exemples de clés :**

```json
{ "key": "commission_rate", "value": 0.20 }
{ "key": "service_fee_cents", "value": 200 }
{ "key": "categories_enabled", "value": ["wash"] }
{ "key": "matching_timeout_t1_minutes", "value": 30 }
{ "key": "matching_timeout_t2_hours", "value": 2 }
{ "key": "cancel_free_hours", "value": 24 }
{ "key": "min_photos_before", "value": 2 }
{ "key": "min_photos_after", "value": 2 }
```

---

## 3. Index recommandés

```sql
CREATE INDEX idx_bookings_client ON bookings(client_id, status);
CREATE INDEX idx_bookings_provider ON bookings(provider_id, status);
CREATE INDEX idx_bookings_slot ON bookings(slot_start, zone_id);
CREATE INDEX idx_provider_zones_zone ON provider_zones(zone_id);
CREATE INDEX idx_reviews_provider ON reviews(provider_id) WHERE NOT is_hidden;
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX idx_service_zones_geo ON service_zones USING GIST(polygon);
```

---

## 4. Données seed MVP (lavage)

### Catégorie

```sql
INSERT INTO service_categories (slug, name, is_enabled, sort_order)
VALUES ('wash', 'Lavage à domicile', true, 1);
```

### Offres

| slug | name | base (€) | durée (min) |
|------|------|----------|-------------|
| wash-exterior | Extérieur express | 35 | 30 |
| wash-interior | Intérieur | 45 | 45 |
| wash-full | Complet | 85 | 90 |
| wash-detailing | Detailing | 180 | 180 |

### Options communes

| slug | name | delta (€) |
|------|------|-----------|
| pet-hair | Poils animaux | +15 |
| child-seat | Sièges enfant | +10 |
| premium-wheels | Jantes premium | +20 |
| ceramic-light | Protection céramique légère | +80 |

### Majorations véhicule (centimes)

| type | delta |
|------|-------|
| citadine | 0 |
| berline | +500 |
| suv | +1000 |
| utilitaire | +1500 |

---

## 5. Évolution future (sans migration lourde)

Pour ajouter une catégorie `battery` :

1. `INSERT INTO service_categories (slug='battery', ...)`
2. Créer `service_offers` avec `form_schema` spécifique
3. Ajouter `provider_capabilities` pour les pros qualifiés
4. Activer dans `platform_config.categories_enabled`
5. **Aucune modification** des tables `bookings`, `payments`, `reviews`
