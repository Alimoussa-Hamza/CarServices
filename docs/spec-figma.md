# Spécification Figma — CARSERVICE

> **Version :** 1.0  
> **Usage :** Brief design complet pour création maquettes Figma  
> **Cible :** Mobile iOS/Android (375 × 812 px base) + variantes  
> **Références :** [Wireframes](wireframes.md) · [Cahier des charges](cahier-des-charges.md)  
> **Prompt UX Pilot (Autoflow Client/Pro/Admin) :** [ux/prompt-ia-ux-carservice.md](ux/prompt-ia-ux-carservice.md)

---

## 1. Brief créatif

### Positionnement
**CarWash** = marketplace premium-accessible de lavage auto à domicile.  
Ton : **confiance + simplicité + écologie**, jamais cheap ni agressif.

### Mots-clés visuels
- Propre, lumineux, rassurant
- Vert éco discret (pas “greenwashing criard”)
- Espace blanc généreux
- Typographie lisible, hiérarchie claire
- Photos réelles de véhicules propres (pas stock générique)

### Références d’inspiration (direction, pas copie)
| App | À reprendre | À éviter |
|-----|-------------|----------|
| Uber | Clarté du parcours, CTA sticky | Sombre, dense |
| Doctolib | Confiance, simplicité médicale | Trop institutionnel |
| Alan | Modernité, couleurs douces | Illustrations lourdes |
| WashOut / CosmétiCar | Contexte métier auto | Identité franchise |

### Anti-patterns
- Rouge/noir agressif type “garage discount”
- Trop d’icônes emoji dans l’UI finale
- Gradients flashy
- Texte < 14 px sur mobile

---

## 2. Structure fichier Figma recommandée

```
📁 CARSERVICE — Design System
   📄 Cover (version, changelog)
   📄 🎨 Foundations (colors, type, grid, icons)
   📄 🧩 Components (atoms → organisms)
   📄 📱 Client App
      ├── Flow Auth
      ├── Flow Réservation (C03–C09)
      ├── Flow Suivi (C10–C11)
      └── États & Edge cases
   📄 🔧 Pro App
      ├── Flow KYC
      ├── Flow Missions (P02–P05)
      └── États & Edge cases
   📄 🖥 Admin (optionnel phase 2)
   📄 🔄 Prototypes (flows cliquables)
   📄 📋 Handoff (specs dev, tokens export)
```

**Naming convention composants :**  
`Category/Component/Variant/State`  
Ex : `Button/Primary/Large/Default`, `Button/Primary/Large/Disabled`

**Naming frames écrans :**  
`[App]-[ID]-[Nom]-[State]`  
Ex : `Client-C08-Paiement-Default`, `Pro-P03-DetailMission-Timer`

---

## 3. Foundations (Design Tokens)

### 3.1 Palette couleurs

#### Brand
| Token | Hex | Usage |
|-------|-----|-------|
| `color/brand/primary` | `#0D6E4F` | CTA principal, liens actifs, stepper actif |
| `color/brand/primary-light` | `#E8F5F0` | Backgrounds hero, badges éco |
| `color/brand/primary-dark` | `#094D38` | Pressed state CTA, headers alternatifs |
| `color/brand/secondary` | `#1A3A5C` | Texte titres alternatif, Pro app accent |
| `color/brand/accent` | `#F5A623` | Badge “Populaire”, highlights |

#### Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| `color/neutral/900` | `#1A1A2E` | Titres, texte principal |
| `color/neutral/700` | `#4A4A68` | Texte secondaire |
| `color/neutral/500` | `#8E8EA9` | Placeholder, labels inactifs |
| `color/neutral/300` | `#D1D1DE` | Bordures, dividers |
| `color/neutral/100` | `#F4F4F8` | Background sections |
| `color/neutral/0` | `#FFFFFF` | Background principal, cards |

#### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `color/success` | `#2E7D4F` | Confirmations, statut OK, zone couverte |
| `color/warning` | `#E67E22` | Alertes modérées, timer expiration |
| `color/error` | `#D32F2F` | Erreurs, hors zone, paiement refusé |
| `color/info` | `#1976D2` | Infobulles, liens informatifs |

#### Surfaces spéciales
| Token | Hex | Usage |
|-------|-----|-------|
| `color/surface/hero` | Linear `#0D6E4F` → `#094D38` | Hero card Home (optionnel, léger) |
| `color/surface/overlay` | `#1A1A2E` @ 40% | Modals backdrop |
| `color/surface/sticky-footer` | `#FFFFFF` + shadow | Footer prix / CTA |

### 3.2 Typographie

**Font principale :** `Inter` (Google Fonts, free)  
**Fallback :** SF Pro (iOS), Roboto (Android)

| Token | Size | Weight | Line-height | Usage |
|-------|------|--------|---------------|-------|
| `text/display/lg` | 28 px | 700 | 34 px | Hero Home |
| `text/display/sm` | 22 px | 700 | 28 px | Titres écrans parcours |
| `text/heading/h1` | 20 px | 600 | 26 px | Sections |
| `text/heading/h2` | 17 px | 600 | 24 px | Sous-sections, card titles |
| `text/body/lg` | 16 px | 400 | 24 px | Corps principal |
| `text/body/md` | 15 px | 400 | 22 px | Descriptions |
| `text/body/sm` | 14 px | 400 | 20 px | Labels, meta |
| `text/caption` | 12 px | 400 | 16 px | Hints, légal, timestamps |
| `text/price/lg` | 24 px | 700 | 30 px | Total sticky footer |
| `text/price/md` | 17 px | 600 | 22 px | Prix cards formules |
| `text/button` | 16 px | 600 | 20 px | Labels boutons |
| `text/button/sm` | 14 px | 600 | 18 px | Boutons secondaires |

**Règle :** jamais de texte interactif < 14 px.

### 3.3 Espacement (grille 4 px)

| Token | Value |
|-------|-------|
| `space/2` | 4 px |
| `space/3` | 8 px |
| `space/4` | 12 px |
| `space/5` | 16 px |
| `space/6` | 20 px |
| `space/7` | 24 px |
| `space/8` | 32 px |
| `space/9` | 40 px |
| `space/10` | 48 px |

**Marges écran :** 20 px horizontal (safe area respectée).  
**Gap cards grid :** 12 px.  
**Padding card interne :** 16 px.

### 3.4 Rayons & ombres

| Token | Value | Usage |
|-------|-------|-------|
| `radius/sm` | 8 px | Chips, tags, inputs |
| `radius/md` | 12 px | Cards, modals |
| `radius/lg` | 16 px | Hero card, bottom sheets |
| `radius/full` | 999 px | Avatars, pills, stepper dots |

| Token | Value | Usage |
|-------|-------|-------|
| `shadow/sm` | 0 1px 3px rgba(26,26,46,0.08) | Cards légères |
| `shadow/md` | 0 4px 12px rgba(26,26,46,0.10) | Cards hover, sticky footer |
| `shadow/lg` | 0 8px 24px rgba(26,26,46,0.14) | Modals, bottom sheets |

### 3.5 Icônes

**Set recommandé :** [Phosphor Icons](https://phosphoricons.com/) ou Lucide  
**Taille standard :** 24 × 24 px (navigation), 20 × 20 px (inline)  
**Stroke :** 1.5 px regular, 2 px bold pour actif

| Contexte | Icône suggérée |
|----------|----------------|
| Lavage | `Car` |
| Éco | `Leaf` |
| Adresse | `MapPin` |
| Créneau | `Calendar` |
| Pro | `UserCircle` |
| Paiement | `CreditCard` |
| Succès | `CheckCircle` |
| En route | `NavigationArrow` |
| Photos | `Camera` |
| Appeler | `Phone` |

---

## 4. Bibliothèque de composants

### 4.1 Atoms

---

#### `Button/Primary`

| Propriété | Valeur |
|-----------|--------|
| Height | 52 px |
| Padding horizontal | 24 px |
| Background | `color/brand/primary` |
| Text | `text/button`, blanc |
| Radius | `radius/md` |
| Min width | 100% (full) ou auto (inline) |

**Variants :** `Large` (52 px) · `Medium` (44 px) · `Small` (36 px)  
**States :** Default · Hover (primary-dark) · Pressed (scale 0.98) · Disabled (neutral/300 bg, neutral/500 text) · Loading (spinner blanc, texte masqué)

---

#### `Button/Secondary`

| Propriété | Valeur |
|-----------|--------|
| Height | 52 px |
| Background | transparent |
| Border | 1.5 px `color/brand/primary` |
| Text | `color/brand/primary` |

**States :** idem Primary

---

#### `Button/Ghost`

Pas de bordure, texte primary, pour liens d’action secondaire (“En savoir plus”, “Modifier”).

---

#### `Button/Destructive`

Background `color/error`, texte blanc. Usage : annuler réservation, refuser mission.

---

#### `Input/Text`

| Propriété | Valeur |
|-----------|--------|
| Height | 52 px |
| Padding | 16 px |
| Border | 1 px `neutral/300` |
| Radius | `radius/sm` |
| Label | au-dessus, `text/body/sm`, neutral/700 |
| Placeholder | neutral/500 |

**States :** Default · Focus (border primary 2 px) · Error (border error + message caption error) · Disabled (bg neutral/100)

---

#### `Input/Search` (autocomplete adresse)

Input/Text + icône `MagnifyingGlass` gauche (20 px, neutral/500) + clear button droite si rempli.

---

#### `Input/OTP`

6 cellules 44 × 52 px, gap 8 px, border focus primary.

---

#### `Checkbox`

20 × 20 px, radius 4 px, check blanc sur fond primary quand coché.  
Label à droite, `text/body/md`.

---

#### `Radio`

20 × 20 px, cercle, dot primary 10 px quand sélectionné.

---

#### `Toggle/Switch`

51 × 31 px (iOS-like), track neutral/300 off, primary on.

---

#### `Chip/Tag`

Height 32 px, padding 12 px horizontal, radius full.  
Variants : `Default` (neutral/100) · `Selected` (primary-light bg, primary text) · `Eco` (primary-light + icône Leaf)

---

#### `Badge`

| Variant | Style |
|---------|-------|
| `Popular` | accent bg, texte blanc, “Populaire” |
| `Eco` | primary-light bg, primary text, icône Leaf |
| `New` | info bg, “Nouveau” |
| `Status` | selon statut booking |

Font : `text/caption`, weight 600, padding 6 px 10 px.

---

#### `Avatar`

| Size | Dimensions |
|------|------------|
| sm | 32 × 32 px |
| md | 48 × 48 px |
| lg | 64 × 64 px |

Radius full, fallback initiales sur fond primary-light.

---

#### `Divider`

1 px, neutral/300, full width ou inset 20 px.

---

#### `Spinner`

24 px, stroke primary 2 px, animation rotation.

---

### 4.2 Molecules

---

#### `Card/ServiceOffer`

**Usage :** C04 catalogue, C03 formules populaires (variant compact).

```
┌─────────────────────────────────────┐  radius md, shadow sm, padding 16
│ [Badge Eco]              [Badge Pop]│
│                                     │
│ EXTÉRIEUR EXPRESS          text/h2  │
│ Carrosserie, jantes, vitres  body/sm│
│                                     │
│ ⏱ 30 min    🍃 Sans eau    caption  │
│                                     │
│ ─────────────────────────────────── │
│ À partir de              price/md   │
│ 35 €                                │
│                                     │
│              [ Button/Secondary sm ]│
└─────────────────────────────────────┘
```

**Variant `Compact` (C03 grid 2 col) :**  
Width ~165 px, titre h2 15 px, prix seul, bouton ghost “Choisir”.

**States :** Default · Pressed · Disabled (offre indisponible, opacity 0.5)

---

#### `Card/HeroCTA`

**Usage :** C03 Home.

| Propriété | Valeur |
|-----------|--------|
| Background | primary-light OU gradient hero léger |
| Padding | 24 px |
| Radius | radius/lg |
| Illustration | voiture line-art droite (optionnel, 80 px) |

Contenu : titre display/sm, sous-titre body/md neutral/700, Button/Primary full width.

---

#### `Card/BookingSummary`

**Usage :** C08 récap, C09 confirmation, C10 détail.

Rows avec icône 20 px + label body/sm + valeur body/md.  
Sections séparées par Divider.

---

#### `Card/MissionPro`

**Usage :** P02 liste missions.

```
┌─────────────────────────────────────┐
│ 🆕 Il y a 3 min              caption│
│ Sam. 6 sept. · 10:00         h2     │
│ Lavage complet · SUV         body/md│
│ 📍 Gerland (~2.3 km)         body/sm│
│ ─────────────────────────────────── │
│ 💰 77,60 € net              price/md│  color success
│ ⏱ ~1h45                      caption│
│              [ Voir détail → ] ghost│
└─────────────────────────────────────┘
```

Border-left 4 px primary si non lu. Shadow md si tap highlight.

---

#### `Card/ProviderProfile`

**Usage :** C10 accepted, P04 client info.

Avatar lg + nom h2 + rating (étoile accent + note body/md) + badge Eco + Button/Secondary sm “Appeler”.

---

#### `Stepper/BookingProgress`

5 steps horizontal, labels sous dots (caption, masqués sur petit écran sauf step actif).

| Élément | Style |
|---------|-------|
| Dot actif | 12 px, primary, filled |
| Dot complété | 12 px, primary, check icon |
| Dot futur | 12 px, neutral/300 |
| Ligne | 2 px, neutral/300 (complété → primary) |

Labels : Formule · Config · Adresse · Créneau · Paiement

---

#### `Timeline/Status`

**Usage :** C10 suivi.

Vertical, gap 16 px.  
Chaque step : dot 12 px + ligne verticale 2 px + label body/md + timestamp caption droite.

| État step | Dot |
|-----------|-----|
| Complété | primary filled + check |
| En cours | primary ring animé (pulse) |
| Futur | neutral/300 |

---

#### `PriceBreakdown`

Liste lignes label / montant alignés.  
Dernière ligne “Total TTC” en text/price/lg, divider au-dessus.

---

#### `StickyFooter/CTA`

Fixed bottom, bg white, shadow/md, padding 16 px 20 px + safe area bottom.

Contenu variable :
- **Config (C05) :** Total price/lg + durée caption + Button/Primary
- **Paiement (C08) :** Button/Primary “Payer XX €” + lock icon + “Paiement sécurisé”

---

#### `SlotPicker/TimeGrid`

Grille 3 colonnes, gap 8 px.  
Chaque slot : height 44 px, radius sm, border neutral/300.

| State | Style |
|-------|-------|
| Available | border neutral/300, text neutral/900 |
| Selected | bg primary-light, border primary 2 px, text primary |
| Disabled | bg neutral/100, text neutral/500, strikethrough optionnel |

---

#### `Calendar/Month`

Header mois + flèches prev/next.  
Grille 7 col, cellules 40 × 40 px.  
Selected : circle primary. Today : ring primary. Past : neutral/500.

---

#### `Map/LocationPicker`

Height 200 px, radius md, overflow hidden.  
Pin central fixe (MapPin primary 32 px).  
Overlay hint caption en bas : “Déplacez la carte pour ajuster”.

---

#### `PhotoUpload/Grid`

Cellules 80 × 80 px, radius sm, border dashed neutral/300.  
Filled : thumbnail + badge check. Empty : icône Camera + “Ajouter”.

---

#### `Checklist/Item`

Row : Checkbox + label body/md.  
Group header : text/heading/h2 + margin top 16 px.

---

#### `Rating/Stars`

5 étoiles 32 px, gap 8 px, tap to rate.  
Empty : neutral/300, Filled : accent.

---

#### `Banner/Alert`

Full width, padding 12 px 16 px, radius sm.

| Variant | Background | Icon |
|---------|------------|------|
| Info | info @ 10% | Info |
| Success | success @ 10% | CheckCircle |
| Warning | warning @ 10% | Warning |
| Error | error @ 10% | XCircle |

---

#### `EmptyState`

Illustration centrée 120 px (line art voiture propre) + titre h1 + body md + CTA optionnel.

---

#### `BottomSheet`

Radius lg top corners, handle 36 × 4 px neutral/300 centré, padding 24 px.  
Usage : refus mission, confirmation clôture, détail annulation.

---

#### `Modal/Dialog`

Width 327 px (centré), radius md, padding 24 px, shadow lg.  
Titre h1 + body + 2 boutons (secondary + primary côte à côte ou stacked).

---

### 4.3 Organisms (sections écran)

---

#### `Header/Navigation`

| Variant | Contenu |
|---------|---------|
| `Home` | Pas de back ; titre logo ou greeting gauche ; avatar/profil droite |
| `Flow` | Back chevron gauche ; titre centre ; action droite optionnelle |
| `Modal` | Titre centre ; X fermer droite |

Height : 56 px + safe area top.  
Background : white, border-bottom 1 px neutral/300 (flow only).

---

#### `TabBar/Client`

Height 56 px + safe area bottom.  
3 items : Accueil · Réservations · Profil.  
Active : icône + label primary. Inactive : neutral/500.

---

#### `TabBar/Pro`

3 items : Missions · Planning · Gains.

---

#### `TabSegment/Missions`

Pill container neutral/100, padding 4 px.  
Segments : Nouvelles (badge count) · À venir · En cours.  
Active segment : white bg, shadow sm, radius sm.

---

#### `Section/Form`

Label heading/h2 + marge bottom 12 px + champs stack gap 16 px.

---

#### `Section/PopularOffers`

Heading “Formules populaires” + grid 2×2 Card/ServiceOffer compact.

---

---

## 5. Spécifications écran par écran (visuelles)

> Layout détaillé : voir [wireframes.md](wireframes.md).  
> Ci-dessous : specs visuelles additionnelles pour Figma.

---

### C03 — Home Client

| Zone | Spec visuelle |
|------|---------------|
| Background | neutral/0 |
| Greeting | “Bonjour, {Prénom} 👋” display/sm — **remplacer emoji par illustration ou sans emoji en prod** |
| Hero | Card/HeroCTA, margin top 8 px |
| Zone badge | Chip Eco variant, icône MapPin, text “Lyon & agglomération” + CheckCircle success |
| Grid formules | 2 col, scroll horizontal optionnel si > 4 |
| Prochaine résa | Card/BookingSummary compact, border-left 4 px primary |

**Prototype link :** Hero CTA → C04 ; Card formule → C05 ; Prochaine resa → C10

---

### C04 — Catalogue

| Zone | Spec visuelle |
|------|---------------|
| Header | Flow + Stepper step 1 |
| Liste | Stack vertical gap 12 px, Card/ServiceOffer full width |
| Footer hint | caption neutral/500 centré, padding bottom 24 px |

**Highlight :** formule “Complet” avec Badge Popular.

---

### C05 — Configuration

| Zone | Spec visuelle |
|------|---------------|
| Header | “Personnaliser” + step 2 |
| Formule rappel | caption + h2 en haut |
| Véhicule | Radio group vertical |
| Options | Checkbox group |
| Commentaire | Input/Text multiline, height 80 px |
| Photos | PhotoUpload/Grid, max 5 |
| Footer | StickyFooter/CTA avec prix live |

**Interaction prix :** animation count-up subtile (optionnel prototype).

---

### C06 — Adresse

| Zone | Spec visuelle |
|------|---------------|
| Search | Input/Search full width |
| CTA position | Button/Ghost + icône NavigationArrow |
| Carte | Map/LocationPicker |
| Adresses saved | Radio list, icône House/Buildings |
| Zone OK | Banner/Alert Success |
| Zone KO | Banner/Alert Error + Input email + Button/Secondary |

---

### C07 — Créneau

| Zone | Spec visuelle |
|------|---------------|
| Calendar | Calendar/Month |
| Slots | SlotPicker/TimeGrid |
| Selection recap | pill primary-light “10:00 – 11:30” |
| Hint | Banner/Alert Info délai min 2 h |

---

### C08 — Paiement

| Zone | Spec visuelle |
|------|---------------|
| Stepper | step 5 actif |
| Récap | Card/BookingSummary + PriceBreakdown |
| Paiement | row carte (logo Visa/MC 32 px) + “···· 4242” + ghost “Changer” |
| CGV | Checkbox + link primary “CGV” |
| Footer | StickyFooter “Payer 97,00 €” disabled si CGV off |

**États à maquetter :** Default · CGV unchecked (CTA disabled) · Processing (overlay spinner) · Error (Banner/Alert Error)

---

### C09 — Confirmation

| Zone | Spec visuelle |
|------|---------------|
| Success icon | CheckCircle 64 px success, animation scale-in |
| Réf | caption monospace “CS-20260906-A7B2” |
| Animation | Lottie pulse/search ou skeleton “Recherche pro…” |
| CTAs | Primary “Suivre” + Ghost “Accueil” |

---

### C10 — Suivi (5 frames)

Créer **5 frames** ou **1 frame avec variants** :

| Variant | Élément clé visuel |
|---------|-------------------|
| `pending_provider` | Timeline step 2 pulse, Spinner |
| `accepted` | Card/ProviderProfile |
| `en_route` | Mini-map 160 px height + ETA h1 |
| `in_progress` | Timer “Depuis 10:02”, step 4 actif |
| `unassigned` | EmptyState warning + 2 CTAs |
| `completed` | redirect C11 |

**Action annuler :** Button/Destructive ghost, visible si > 24 h.

---

### C11 — Avis

| Zone | Spec visuelle |
|------|---------------|
| Photos | 2 col before/after, labels caption |
| Stars | Rating/Stars centré |
| Tags | Chip row multi-select |
| CTA | Primary “Envoyer” + Ghost “Plus tard” |

---

### P02 — Missions Pro

| Zone | Spec visuelle |
|------|---------------|
| Header | Greeting + stats caption (note + taux acceptation) |
| Tabs | TabSegment/Missions |
| Liste | Card/MissionPro stack gap 12 px |
| KYC banner | Banner/Alert Warning sticky top si pending |

**Badge “Nouvelles (2)” :** accent circle 18 px, texte blanc caption.

---

### P03 — Détail mission

| Zone | Spec visuelle |
|------|---------------|
| Timer | Banner/Alert Warning “Expire dans 08:42” — countdown visuel |
| Map preview | static map blur quartier, 120 px height |
| Rémunération | PriceBreakdown, ligne net en success bold |
| Photos client | scroll horizontal 64 px thumbs |
| Footer | 2 boutons 50/50 : Destructive secondary “Refuser” + Primary “Accepter” |

**Bottom sheet Refuser :** Radio motifs + Confirmer.

---

### P04 — Mission acceptée

| Zone | Spec visuelle |
|------|---------------|
| Statut pill | Badge status “Acceptée” success |
| Client | Card/ProviderProfile layout inversé (client) |
| Adresse | h2 + body + Button/Primary “Ouvrir Maps” icône |
| Carte | full width 180 px, itinéraire tracé |
| CTA principal | morphing : “En route” → “Arrivé / Démarrer” |

---

### P05 — Exécution

| Zone | Spec visuelle |
|------|---------------|
| Timer live | “Démarré à 10:02” caption + progress bar optionnelle |
| Checklist | Checklist/Item groups Extérieur / Intérieur |
| Photos | 2 sections AVANT / APRÈS, compteur “2/2 min” caption |
| CTA | Primary full “Terminer la prestation” — disabled si incomplet |

**Modal clôture :** Modal/Dialog avec gain net success.

---

## 6. Prototype Figma — flows à relier

### Flow Client (priorité 1)
```
C03 → C04 → C05 → C06 → C07 → C08 → C09 → C10 (accepted)
```

### Flow Client edge cases
```
C06 (hors zone) → lead submitted
C08 (payment error) → retry
C10 (unassigned) → reschedule / refund
C10 (completed) → C11
```

### Flow Pro (priorité 1)
```
P02 → P03 → P04 (en route) → P04 (arrivé) → P05 → success modal → P02
```

### Flow Pro edge cases
```
P02 (KYC pending) → P01
P03 (refuse) → bottom sheet → P02
P04 (cancel) → modal motif
```

**Transitions :** Smart Animate 300 ms ease-out pour slides horizontales parcours ; Dissolve 200 ms modals.

---

## 7. Responsive & plateformes

| Breakpoint | Frame | Notes |
|------------|-------|-------|
| Base | 375 × 812 | iPhone 13 mini / standard |
| Large mobile | 390 × 844 | iPhone 14/15 |
| Android | 360 × 800 | Minimum support |
| Tablet | 768 × 1024 | Phase 2 — layout 2 col possible |

**Safe areas :** top 47 px, bottom 34 px (iPhone notch) — utiliser Figma iOS UI kit frames.

**Android differences :** back gesture vs chevron ; status bar 24 px ; material ripple on buttons (spec as pressed state).

---

## 8. Assets à produire

| Asset | Format | Spec |
|-------|--------|------|
| Logo CARSERVICE | SVG | Version full + icon seul (mark) |
| App icon | 1024 × 1024 | Mark sur fond primary ou blanc |
| Splash | 375 × 812 | Logo centré + spinner |
| Illustration empty state | SVG | Voiture propre line-art, primary stroke |
| Illustration hero | SVG | Optionnel C03 |
| Payment logos | SVG | Visa, Mastercard, Apple Pay (badges) |
| Map style | — | Snazzy Maps “Silver” ou Mapbox light custom |

**Photos :** banque Unsplash/Pexels — véhicules propres, contexte résidentiel français, lumière naturelle.  
**Pas de :** stock US muscle cars, contexte station lavage rouleau.

---

## 9. Accessibilité (WCAG 2.1 AA)

| Règle | Application |
|-------|-------------|
| Contraste texte | ≥ 4.5:1 body, ≥ 3:1 large text |
| Touch targets | Min 44 × 44 px (boutons 52 px OK) |
| Focus | Ring 2 px primary offset 2 px (web) |
| Statuts | Jamais couleur seule — icône + texte |
| Labels | Tous inputs avec label visible ou aria |
| Motion | Réduire animations si prefers-reduced-motion |

---

## 10. Handoff développeur

### Export tokens
Utiliser **Figma Variables** (ou Tokens Studio plugin) pour :
- Colors
- Spacing
- Typography
- Radius
- Shadows

Export JSON → compatible Style Dictionary / React Native Paper / Tailwind.

### Specs à annoter par frame
- Spacing entre sections (px)
- Composant instance name
- Variants et états
- Copy exact (FR)
- Conditions affichage (“si hors zone”, “si CGV unchecked”)

### Naming dev (suggéré)
```
components/Button/Primary.tsx
components/cards/ServiceOfferCard.tsx
screens/client/HomeScreen.tsx
screens/client/booking/PaymentScreen.tsx
screens/pro/MissionDetailScreen.tsx
```

### Copy deck (textes MVP)

| Clé | Texte FR |
|-----|----------|
| `home.hero.title` | Lavage à domicile |
| `home.hero.subtitle` | Pro éco, assuré, chez vous |
| `home.cta.primary` | Réserver maintenant |
| `booking.step.formula` | Formule |
| `booking.step.config` | Personnaliser |
| `booking.step.address` | Adresse |
| `booking.step.slot` | Créneau |
| `booking.step.payment` | Paiement |
| `payment.secure` | Paiement sécurisé |
| `status.pending_provider` | Recherche d'un professionnel… |
| `status.accepted` | Pro confirmé |
| `status.en_route` | En route |
| `status.in_progress` | Lavage en cours |
| `status.completed` | Terminé |
| `eco.badge` | Sans eau |

---

## 11. Checklist livrables designer

- [ ] Figma file structuré (cf. section 2)
- [ ] Design tokens / Variables configurées
- [ ] Composants atoms → organisms avec variants & states
- [ ] 9 écrans client (C03–C11) + 4 états C10
- [ ] 4 écrans pro (P02–P05) + modals
- [ ] Prototype cliquable flows client + pro
- [ ] Edge cases (erreur paiement, hors zone, KYC pending, timeout)
- [ ] App icon + splash
- [ ] Page handoff avec tokens export JSON
- [ ] Revue contraste accessibilité

---

## 12. Références internes

- [Wireframes textuels](wireframes.md)
- [Cahier des charges](cahier-des-charges.md)
- [Règles de gestion](regles-de-gestion.md)

---

*Document prêt pour brief designer freelance ou équipe produit. Une fois les maquettes Figma créées, ajouter le lien Figma en tête de ce fichier.*
