# Règles de gestion — CARSERVICE

> Référence pour le développement et les tests. Toutes les règles sont configurables côté admin sauf mention contraire.

---

## 1. Catalogue & prix — RG-CAT

| ID | Règle |
|----|--------|
| **RG-CAT-01** | Toute offre appartient à une `ServiceCategory` (`wash` en MVP). |
| **RG-CAT-02** | Prix TTC client = `base(offre, zone)` + `maj(véhicule)` + `sum(options)` + `frais_service`. |
| **RG-CAT-03** | Le prix affiché au récap est **figé (snapshot)** dans le booking à la création. |
| **RG-CAT-04** | Seules les méthodes `waterless` / `steam` sont autorisées pour `wash`. |
| **RG-CAT-05** | Offre inactive : invisible à la réservation, visible en historique. |
| **RG-CAT-06** | Durée estimée = durée base + deltas options/véhicule ; sert au planning. |

### Formules de calcul prix

```
prix_client_ttc = offer_base_price
                + vehicle_surcharge[vehicle_type]
                + SUM(option.price_delta)
                + service_fee
                + zone_coefficient (si applicable)
```

---

## 2. Zoning — RG-ZONE

| ID | Règle |
|----|--------|
| **RG-ZONE-01** | Booking créé seulement si `lat/lng ∈ zone active`. |
| **RG-ZONE-02** | Un pro ne reçoit que des missions dans `zones_pro ∩ zones_plateforme`. |
| **RG-ZONE-03** | Lead "hors zone" stocké (email/tel + adresse) pour expansion. |

---

## 3. Matching & assignation — RG-MATCH

**Mode MVP :** broadcast limité (top N pros éligibles, premier accepté gagne).

| ID | Règle |
|----|--------|
| **RG-MATCH-01** | Éligible = KYC `approved` + capability offre + zone + dispo créneau + RC Pro valide. |
| **RG-MATCH-02** | Score tri = distance ↑, note ↓, taux acceptation ↓, retard ↑ (pénalité). |
| **RG-MATCH-03** | Proposer aux **top 5–10** ; acceptation exclusive (verrou booking). |
| **RG-MATCH-04** | Si aucun accept sous **T1 = 30 min** → élargir rayon / notifier plus de pros. |
| **RG-MATCH-05** | Si aucun pro sous **T2 = 2 h** (ou H-2 avant créneau) → `unassigned` : client reclasse ou remboursement auto. |
| **RG-MATCH-06** | Pro ne peut pas s'assigner une mission hors capabilities. |

### Algorithme de scoring (simplifié)

```
score = (distance_km * -10)
      + (rating * 20)
      + (acceptance_rate * 15)
      - (late_count * 5)
      - (cancel_count * 10)
```

---

## 4. Booking & statuts — RG-BOOK

### Machine à états

```
draft
  → payment_authorized
  → pending_provider
  → accepted
  → en_route
  → in_progress
  → completed

Branches :
  → cancelled_by_client
  → cancelled_by_provider
  → cancelled_by_admin
  → expired
  → disputed
```

| ID | Règle |
|----|--------|
| **RG-BOOK-01** | Transitions strictes (pas de saut arbitraire sauf admin). |
| **RG-BOOK-02** | `en_route` seulement après `accepted`. |
| **RG-BOOK-03** | `in_progress` : géofence optionnelle (≤ X m de l'adresse). |
| **RG-BOOK-04** | `completed` uniquement si pro + photos min validées. |
| **RG-BOOK-05** | 1 booking = 1 adresse, 1 créneau, 1 offre principale. |

### Transitions autorisées

| De | Vers | Acteur |
|----|------|--------|
| `draft` | `payment_authorized` | Système (paiement OK) |
| `payment_authorized` | `pending_provider` | Système |
| `pending_provider` | `accepted` | Pro |
| `accepted` | `en_route` | Pro |
| `en_route` | `in_progress` | Pro |
| `in_progress` | `completed` | Pro |
| `*` (avant `in_progress`) | `cancelled_*` | Client / Pro / Admin |
| `completed` | `disputed` | Client (≤ 48 h) |

---

## 5. Annulations — RG-CANCEL

| Délai avant créneau | Client | Pro |
|---------------------|--------|-----|
| **> 24 h** | Gratuit / full reverse auth | OK sans pénalité forte |
| **2–24 h** | Frais X % ou frais fixes | Pénalité score + warning |
| **< 2 h** | Frais élevés / non remboursable partiel | Pénalité forte ; re-matching urgent |
| **No-show client** | Capture partielle/totale | Pro indemnisé |
| **No-show pro** | Rembourse client 100 % + geste | Suspension temporaire possible |

| ID | Règle |
|----|--------|
| **RG-CANCEL-01** | Motif obligatoire côté pro. |
| **RG-CANCEL-02** | Annulation client après `in_progress` : via litige uniquement. |

---

## 6. Paiement — RG-PAY

| ID | Règle |
|----|--------|
| **RG-PAY-01** | À la réservation : **pre-authorization** du montant snapshot. |
| **RG-PAY-02** | Capture à `completed` (ou no-show client selon RG-CANCEL). |
| **RG-PAY-03** | Net pro = `montant_capture − commission% − frais_fixes`. |
| **RG-PAY-04** | Versement pro selon calendrier PSP (J+2 / J+7). |
| **RG-PAY-05** | Remboursement total libère l'auth / reverse capture. |
| **RG-PAY-06** | Échec paiement → pas de `pending_provider`. |

### Exemple calcul commission

```
montant_client     = 90,00 €
commission (20%)   = 18,00 €
net_pro            = 72,00 €
```

---

## 7. KYC & conformité Pro — RG-KYC

| ID | Règle |
|----|--------|
| **RG-KYC-01** | SIRET valide + document RC Pro non expiré obligatoires. |
| **RG-KYC-02** | Alerte J-30 avant expiration RC Pro ; **blocage** à expiration. |
| **RG-KYC-03** | Au moins une méthode éco déclarée (`waterless` ou `steam`). |
| **RG-KYC-04** | Faux documents → rejet + ban. |
| **RG-KYC-05** | Capabilities hors `wash.*` ignorées en MVP. |

---

## 8. Qualité & avis — RG-QUAL

| ID | Règle |
|----|--------|
| **RG-QUAL-01** | Photos avant/après stockées liées au booking (rétention RGPD : 24 mois). |
| **RG-QUAL-02** | Note pro = moyenne avis non masqués. |
| **RG-QUAL-03** | Note < 3.5 sur N avis → review admin / réduction matching. |
| **RG-QUAL-04** | Client ne peut noter que bookings `completed`. |
| **RG-QUAL-05** | Fenêtre avis : 72 h après `completed`. |

---

## 9. Litiges — RG-DISPUTE

| ID | Règle |
|----|--------|
| **RG-DISPUTE-01** | Ouverture possible jusqu'à **48 h** après `completed`. |
| **RG-DISPUTE-02** | Motifs : qualité, retard, dégât, no-show, autre. |
| **RG-DISPUTE-03** | Freeze versement pro tant que litige ouvert. |
| **RG-DISPUTE-04** | Décision admin sous SLA 72 h ouvrées. |

---

## 10. Notifications — RG-NOTIF

| Événement | Destinataire | Canal |
|-----------|--------------|-------|
| Paiement OK | Client | Push + email |
| Pro trouvé | Client | Push + SMS |
| En route | Client | Push |
| Terminé | Client | Push |
| Nouvelle mission | Pro | Push + SMS |
| Rappel H-1 | Pro | Push |
| Annulation | Client + Pro | Push |
| KYC approuvé/rejeté | Pro | Push + email |
| Docs expire bientôt | Pro | Push + email |

---

## 11. RGPD & sécurité — RG-SEC

| ID | Règle |
|----|--------|
| **RG-SEC-01** | Consentement géoloc explicite. |
| **RG-SEC-02** | Adresse exacte pro **après** acceptation uniquement. |
| **RG-SEC-03** | Droit suppression compte (anonymisation ; bookings comptables conservés). |
| **RG-SEC-04** | Logs accès admin aux documents KYC. |
| **RG-SEC-05** | Photos : usage strict SAV/qualité ; pas marketing sans consentement. |

---

## 12. Évolutivité multi-services — RG-EXT

| ID | Règle |
|----|--------|
| **RG-EXT-01** | Parcours réservation lit `category` + `formSchema` de l'offre. |
| **RG-EXT-02** | Feature flag `categories.enabled = ["wash"]`. |
| **RG-EXT-03** | Matching filtre sur `capabilities[]` (non hardcodé "lavage"). |
| **RG-EXT-04** | Checklist clôture = template lié à l'offre, pas au code écran. |

---

## 13. Données snapshotées dans un Booking

Pour ne pas casser l'historique si le catalogue change :

```json
{
  "offer_id": "uuid",
  "offer_name": "Lavage complet",
  "category": "wash",
  "pricing_breakdown": {
    "base": 70.00,
    "vehicle_surcharge": 10.00,
    "options": [{ "name": "Poils animaux", "price": 15.00 }],
    "service_fee": 2.00,
    "total_ttc": 97.00
  },
  "vehicle_type": "suv",
  "options": ["pet_hair"],
  "address_snapshot": { "street": "...", "lat": 0, "lng": 0 },
  "slot_start": "2026-09-01T10:00:00Z",
  "slot_end": "2026-09-01T11:00:00Z",
  "provider_id": "uuid",
  "commission_rate_snapshot": 0.20,
  "status": "completed"
}
```
