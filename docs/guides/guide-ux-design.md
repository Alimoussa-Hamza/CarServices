# Guide UX & Design — CARSERVICE

> **Phase :** pré-développement · **Livrables :** parcours, personas, copy, critères UX  
> **Prompt UX Pilot (Autoflow) :** [prompt-ia-ux-carservice.md](../ux/prompt-ia-ux-carservice.md)  
> **Pendant le build mobile :** [cahier-bonnes-pratiques-ui.md](../cahier-bonnes-pratiques-ui.md) — design, couleurs, nommage, composants, anti-dérive

---

## 1. Personas

### Persona 1 — Claire, 34 ans, cliente urbaine
- **Contexte :** cadre Lyon, parking sous-sol, peu de temps
- **Besoin :** lavage qualité sans se déplacer
- **Frustration :** stations rouleau, créneaux garages
- **Appareil :** iPhone, habituée apps services (Uber, Deliveroo)
- **Budget :** 70–120 € acceptable si qualité

### Persona 2 — Marc, 28 ans, pro lavage mobile
- **Contexte :** auto-entrepreneur, méthode sans eau, 2 ans d’expérience
- **Besoin :** remplir planning, clients sérieux, paiement garanti
- **Frustration :** clients no-show, impayés, prospection chronophage
- **Appareil :** Android milieu de gamme
- **Objectif :** 8–12 missions/semaine via l’app

### Persona 3 — Admin ops (interne)
- **Contexte :** opérateur plateforme, 30 min/jour sur admin
- **Besoin :** valider KYC vite, traiter litiges, ajuster tarifs zone

---

## 2. Parcours utilisateur (maps)

### Client — Happy path
```
Découverte → Inscription OTP → Home → Formule → Config → Adresse OK
→ Créneau → Paiement → Confirmation → Pro assigné → Suivi → Avis
```
**Durée cible :** réservation < 2 min · attente pro < 2 h

### Client — Edge paths
- Hors zone → capture email
- Paiement refusé → retry
- Aucun pro → replanifier / remboursement
- Annulation > 24 h → gratuit

### Pro — Happy path
```
Inscription → KYC wizard → Validation admin → Mission reçue → Accept
→ En route → Checklist + photos → Clôture → Gains
```

### Pro — Edge paths
- KYC rejeté → correction + resubmit
- Refus mission → motif
- Annulation tardive → pénalité score

---

## 3. Principes UX

| Principe | Application |
|----------|-------------|
| **Confiance d’abord** | Badge éco, pro vérifié, prix avant paiement |
| **Progressive disclosure** | Options avancées après formule |
| **Feedback constant** | Stepper, timeline, push |
| **Erreurs actionnables** | “Choisir autre créneau” pas juste “Erreur” |
| **Mobile-first** | Thumb zone CTAs bas écran |
| **Accessibilité** | Contraste AA, labels, pas couleur seule |

---

## 4. Copy deck FR (MVP)

### Global
| Clé | Texte |
|-----|-------|
| `app.name` | CarWash |
| `app.tagline` | Lavage auto à domicile, éco et assuré |
| `cta.book` | Réserver maintenant |
| `cta.continue` | Continuer |
| `cta.pay` | Payer {amount} |
| `legal.terms` | J'accepte les CGU et la politique de confidentialité |

### Home
| Clé | Texte |
|-----|-------|
| `home.greeting` | Bonjour, {name} |
| `home.hero.title` | Lavage à domicile |
| `home.hero.subtitle` | Pro certifié, sans eau, chez vous |
| `home.zone.ok` | Zone couverte · {zoneName} |
| `home.zone.no` | Bientôt disponible chez vous |

### Booking
| Clé | Texte |
|-----|-------|
| `booking.step.formula` | Choisir formule |
| `booking.step.config` | Personnaliser |
| `booking.step.address` | Adresse |
| `booking.step.slot` | Créneau |
| `booking.step.payment` | Paiement |
| `booking.total` | Total TTC |
| `booking.pro.pending` | Pro assigné après confirmation |

### Statuts
| Clé | Texte |
|-----|-------|
| `status.pending_provider` | Recherche d'un professionnel… |
| `status.accepted` | Pro confirmé |
| `status.en_route` | En route |
| `status.in_progress` | Lavage en cours |
| `status.completed` | Terminé |
| `status.cancelled` | Annulé |

### Pro
| Clé | Texte |
|-----|-------|
| `pro.mission.new` | Nouvelle mission |
| `pro.mission.accept` | Accepter |
| `pro.mission.decline` | Refuser |
| `pro.mission.en_route` | Je suis en route |
| `pro.mission.arrived` | Je suis arrivé |
| `pro.mission.complete` | Terminer la prestation |
| `pro.earnings.net` | Vous gagnez {amount} net |

### Erreurs
| Clé | Texte |
|-----|-------|
| `error.zone` | Cette adresse n'est pas encore couverte. |
| `error.payment` | Paiement refusé. Vérifiez votre carte. |
| `error.network` | Connexion impossible. Réessayez. |
| `error.otp` | Code incorrect. |

---

## 5. États UI obligatoires (chaque écran)

| État | Quand |
|------|-------|
| Loading | Fetch API |
| Empty | Pas de données |
| Error | API fail |
| Success | Action OK |
| Disabled | Validation incomplete |

Designer doit maquetter **minimum** : default + loading + error pour écrans P0.

---

## 6. Micro-interactions

| Action | Feedback |
|--------|----------|
| Tap CTA | Haptic light + loader |
| Paiement OK | Check animation + redirect |
| Pro accepté | Push + badge timeline |
| Photo upload | Progress bar |
| Pull refresh missions | Spinner natif |

---

## 7. Livrables design avant dev

- [ ] Maquettes Figma C03–C11, P02–P05
- [ ] Composants Figma = spec-figma.md
- [ ] Prototype 2 flows (client book, pro accept)
- [ ] Export tokens JSON
- [ ] Assets : logo, icon app, splash

---

→ [Wireframes](../wireframes.md) · [Spec Figma](../spec-figma.md) · [Prompt IA UX](../ux/prompt-ia-ux-carservice.md)
