# Cahier de bonnes pratiques UI — CarWash (moderne & anti-dérive)

> **Marque UI :** CarWash · **Repo :** CARSERVICE  
> **Cible :** `apps/mobile-client` (M11), puis Pro / Admin  
> **Tokens :** `@carservice/ui-tokens` · **Maquettes :** [ux/maquettes-client-carwash.pdf](ux/maquettes-client-carwash.pdf)  
> **Complète :** [standards-developpement.md](standards-developpement.md) §8 · [cahier-mobile-client-m11.md](cahier-mobile-client-m11.md)

Objectif : coder **vite et moderne** sans créer de dette visuelle/code qui se transforme en bugs d’évolution (écarts maquette, couleurs hardcodées, composants jumeaux, états incohérents).

---

## 1. Principes non négociables

| # | Principe | Anti-bug évolution |
|---|----------|--------------------|
| P1 | **Tokens = source unique** | Jamais `#0D6E4F` / spacing magique dans un écran |
| P2 | **UI FR / code EN** | Pas de strings métier éparpillées en dur |
| P3 | **Métier côté API** | Pas de pricing / state machine / matching dans l’app |
| P4 | **1 responsabilité / composant** | Pas de “God screen” de 800 lignes |
| P5 | **Server state ≠ UI state** | Query pour API ; Zustand pour draft local |
| P6 | **Maquettes = contrat** | PDF v2 = vérité visuelle ; écart = ticket DS, pas “au feeling” |
| P7 | **Accessibilité dès le 1er commit** | Contraste, labels, `testID`, zone tactile ≥ 44 |
| P8 | **1 feature → tests → commit → push** | Pas d’empilement de stories non poussées ; TU sur logique |

---

## 2. Design & couleurs

### 2.1 Palette CarWash (référence)

Utiliser **uniquement** les exports de `@carservice/ui-tokens` :

| Rôle | Token | Hex (réf.) | Usage |
|------|-------|------------|--------|
| Brand | `colors.brand.primary` | `#0D6E4F` | CTA principal, liens actifs, focus |
| Brand light | `colors.brand.primaryLight` | `#E8F5F0` | Fonds soft, chips sélectionnés |
| Brand dark | `colors.brand.primaryDark` | `#094D38` | Pressed / dark accents |
| Secondary | `colors.brand.secondary` | `#1A3A5C` | Titres secondaires, headers sobres |
| Accent | `colors.brand.accent` | `#F5A623` | Highlight rare (badge promo, attention) — **pas** CTA principal |
| Neutrals | `colors.neutral.*` | 900→0 | Texte, bordures, fonds |
| Success / Warning / Error / Info | `colors.semantic.*` | — | Statuts uniquement |

**Interdit**

- Hex littéraux dans JSX/StyleSheet (sauf exception documentée + ticket DS)
- Nouvelle couleur “parce que joli” sans passer par `ui-tokens` + test tokens
- Violet / neon glow / glassmorphism générique IA (hors marque)
- Accent orange en CTA primaire (réservé aux accents ponctuels)

### 2.2 Hiérarchie couleur (règle des 80/15/5)

| Part | Couleur | Rôle |
|------|---------|------|
| ~80 % | Neutrals | Surface, texte, séparateurs |
| ~15 % | Brand green | Actions, navigation active, trust |
| ~5 % | Semantic + accent | Erreurs, warnings, rare highlight |

### 2.3 Surfaces & elevation

| Niveau | Usage | Règle |
|--------|--------|-------|
| Background app | `neutral.100` ou blanc | Pas de fond plat unique sans respiration |
| Card / sheet | `neutral.0` + radius `md` (12) | Ombre **légère** ou bordure `neutral.300` — pas multi-shadow |
| Overlay | Scrim sombre semi-opaque | Contenu focus ; pas de badges flottants décoratifs |

### 2.4 Radius & spacing

- Radius composants : `radius.md` (12) par défaut ; `sm` inputs ; `lg` sheets ; `full` avatars/pills **uniquement** si maquette
- Spacing : échelle `spacing` (4→48) — pas de `margin: 13` ou `gap: 7`
- CTA sticky bas : padding safe-area + `spacing.5` minimum

### 2.5 Typographie

- Charger **fonts brand** via Expo (display + body) — éviter stack Inter seule si maquette impose autre chose
- Échelle fixe (ex. `display`, `title`, `body`, `caption`, `label`) dans tokens ou `theme.typography`
- **Jamais** `fontSize: 17` ad hoc : ajouter un token si besoin
- Titres FR courts ; pas de titre qui écrase la marque sur splash/home

### 2.6 Iconographie & assets

- Logo mark CarWash (pas goutte d’eau générique)
- Icônes : **une** lib cohérente (ex. lucide / SF-like) — pas mix Material + Ionicons + emoji
- Images : `expo-image` ; tailles définies ; pas de stretch

---

## 3. Nommage

### 3.1 Fichiers & dossiers

| Élément | Convention | Exemple |
|---------|------------|---------|
| Composant | kebab-case fichier = PascalCase export | `service-offer-card.tsx` → `ServiceOfferCard` |
| Hook | `use-*.ts` | `use-booking-draft.ts` |
| Store Zustand | `*.store.ts` | `booking-draft.store.ts` |
| Screen Expo Router | kebab / segments dossier | `app/(tabs)/bookings.tsx` |
| Test | `*.spec.ts(x)` ou `*.test.tsx` | adjacent ou `__tests__/` |
| Mock | `mocks/*.ts` | `mocks/catalog.ts` |
| i18n keys | dot.case FR sémantique | `booking.step.payment` |

### 3.2 Identifiants code

| Type | Style | Exemple |
|------|-------|---------|
| Composants / types | PascalCase | `StickyCta`, `BookingStatus` |
| Fonctions / vars | camelCase | `formatPriceTtc`, `isOutOfZone` |
| Constantes | SCREAMING_SNAKE si globales | `MAX_OTP_ATTEMPTS` |
| Enums / unions métier | alignés `shared-types` | `BookingStatus` — **pas** de doublon local |
| Query keys | tuple stable | `['bookings', id]` |
| Routes | segments stables | `/book/slot` — ne pas renommer sans ticket |

### 3.3 Mapping écran ↔ code

Toujours garder le **ID maquette** dans un commentaire ou doc route :

```text
C08 Paiement → app/book/pay.tsx → CS-M11-S05
```

Ça évite les renommages orphelins et les doublons “PaymentScreen” / “Checkout”.

### 3.4 Props & events

| Pattern | Oui | Non |
|---------|-----|-----|
| Callback | `onSelect`, `onPressPay` | `handleSomething` passé en prop |
| Booléen | `isLoading`, `hasError` | `loading`, `err` |
| Slot children | `children` ou `trailing` | `renderX` sauf besoin réel |
| testID | `testID="book-pay-cta"` | IDs aléatoires / absents |

---

## 4. Composants

### 4.1 Couches (ne pas mélanger)

```
screens / routes          → composition, navigation, data hooks
features/*                → logique UI d’un parcours (booking stepper)
components/ui/*           → primitifs dumb (Button, Input, Badge)
components/<domain>/*     → composés métier présentationnels (OfferCard)
hooks / stores / services → data & side-effects
```

**Règle :** un fichier dans `components/ui` **ne** connaît **pas** TanStack Query, Stripe, ni SecureStore.

### 4.2 Catalogue minimal (à ne pas réinventer)

| Composant | Rôle | Variantes autorisées |
|-----------|------|----------------------|
| `Button` | CTA | `primary` \| `secondary` \| `ghost` \| `destructive` + `loading` \| `disabled` |
| `Input` | Texte | label, error, helper |
| `OtpInput` | 6 cases | focus auto, paste |
| `Badge` | Statut | semantic colors only |
| `Card` | Conteneur interactif | pressable optionnel |
| `StickyCta` | Barre bas | safe-area |
| `EmptyState` | Liste vide | titre + CTA |
| `ErrorBanner` | Erreur actionnable | message + retry |
| `Stepper` | Booking C04–C08 | steps from i18n |

Avant d’ajouter un nouveau primitif : **chercher** dans `components/ui`. Si quasi-identique → étendre props, ne pas cloner.

### 4.3 API composant (contrat stable)

```tsx
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  testID?: string;
};
```

- Props optionnelles avec **defaults** documentés
- Pas de props qui changent de sens (`type="primary"` un jour, enum le lendemain sans migration)
- Éviter `style?: any` — préférer `className` (NativeWind) ou slots contrôlés

### 4.4 États UI obligatoires (tout écran data)

| État | UI | Bug évité |
|------|-----|-----------|
| Loading | Skeleton / spinner localisé | Flash vide / double submit |
| Empty | `EmptyState` | Écran blanc |
| Error | `ErrorBanner` + retry | “ça marche pas” sans action |
| Success | feedback court / navigation | utilisateur perdu |
| Disabled | CTA disabled + raison | paiement double |

### 4.5 Listes & perf

- `FlatList` / `FlashList` pour listes ; pas de `.map` géant dans `ScrollView`
- `key` stable (id métier), pas index
- Images : taille + cache ; pas de re-fetch inutile (Query `staleTime`)

---

## 5. Architecture data (anti-bugs d’évolution)

### 5.1 Qui possède quoi

| Donnée | Où | Interdit |
|--------|-----|----------|
| JWT | SecureStore + auth store | AsyncStorage clair |
| Draft booking wizard | Zustand | Recalcul prix local “au feeling” |
| Catalog, bookings, me | TanStack Query | Dupliquer en Context global |
| Prix TTC | API `quote` | Formules hardcodées mobile |
| Feature flags / mocks | `EXPO_PUBLIC_USE_MOCKS` | Branches `if (dev)` éparpillées |

### 5.2 Couche mock moderne

```text
services/api.ts  →  si USE_MOCKS → mocks/*  sinon  @carservice/api-client
```

- Mocks **mêmes shapes** que `shared-types` (Zod parse en test)
- Un seul toggle env — pas de mock collé dans le JSX

### 5.3 Formulaires

- React Hook Form + resolver Zod depuis `@carservice/shared-types`
- Erreurs = messages FR i18n mappés codes API (`VALIDATION_ERROR`, etc.)
- Debounce quote 300 ms (déjà guide mobile)

### 5.4 Navigation

- Expo Router file-based ; deep links prévus tôt (`bookings/[id]`)
- Stepper booking : ordre fixe C04→C08 ; back = draft conservé
- Pas de navigation impérative sauf deep link / reset auth

---

## 6. Patterns modernes recommandés (Expo / RN 2025+)

| Domaine | Faire | Éviter |
|---------|-------|--------|
| Navigation | Expo Router + layouts | React Navigation config manuelle parallèle |
| Styles | Tokens + NativeWind **ou** StyleSheet thématisé | Inline styles hex partout |
| Data | Query + mutations + invalidation | `useEffect` + `fetch` dans chaque screen |
| Auth gate | Layout `(auth)` vs `(tabs)` | Checks `if (!token)` dans 20 fichiers |
| Safe area | `SafeAreaProvider` + StickyCta | Padding hardcodé iPhone X |
| A11y | `accessibilityLabel`, role, contraste AA | Couleur seule pour statut |
| Tests | RNTL + testID stables | Snapshots géants fragiles |
| Types | Props strictes, pas `any` | `as any` pour “débloquer” |

---

## 7. Anti-patterns → bugs d’évolution (checklist revue PR)

Cocher avant merge UI :

### Design
- [ ] Aucun hex hors `ui-tokens`
- [ ] CTA primary = brand green, pas accent
- [ ] Radius / spacing sur échelle tokens
- [ ] Alignement maquette PDF (écran ID Cx)

### Composants
- [ ] Pas de nouveau Button/Input “local” si primitif existe
- [ ] Pas de fetch dans `components/ui`
- [ ] États loading / empty / error gérés
- [ ] `testID` sur CTA critiques

### Nommage & structure
- [ ] Fichier kebab, export PascalCase
- [ ] Route documentée (Cx + story)
- [ ] Query keys stables, pas strings inventées

### Métier & data
- [ ] Aucune règle pricing / statut booking inventée côté mobile
- [ ] Types depuis `shared-types` / api-client
- [ ] Mock shapes = API réelle

### i18n & copy
- [ ] Textes FR dans `fr.json` (ou module i18n), pas hardcodés (sauf prototype jetable ≤ 1 PR)
- [ ] Copy alignée [guide-ux-design.md](guides/guide-ux-design.md) §4

### Perf & qualité
- [ ] Pas de re-render évident (store trop large → slice)
- [ ] Listes virtualisées si > ~20 items
- [ ] `pnpm --filter @carservice/mobile-client typecheck` vert

---

## 8. Évolution design system (process)

Quand la maquette **change** ou qu’un besoin UI nouveau apparaît :

1. **Ticket DS** (pas de silent change) — noter écran Cx
2. Modifier **`packages/ui-tokens`** (+ test `tokens.spec.ts`)
3. Propager via ThemeProvider / NativeWind theme
4. Mettre à jour **un** composant primitif
5. Screens consomment automatiquement — pas de chase hex fichier par fichier
6. Si Pro/Admin partagent : extraire dans `packages/mobile-ui` seulement si **≥ 3** usages identiques

**Jamais** éditer 15 écrans pour “un vert un peu plus clair”.

---

## 9. DoD “qualité UI” par story M11

Pour chaque story CS-M11-Sxx :

- [ ] Écran conforme PDF (layout, CTA bas, stepper si booking)
- [ ] Tokens only + composants catalogue
- [ ] FR i18n + empty/error/loading
- [ ] Mode mock OK sur le parcours touché
- [ ] Test unitaire ou RNTL si composant/hook critique
- [ ] Pas de logique métier nouvelle hors API

---

## 10. Liens rapides

| Doc | Usage |
|-----|--------|
| [cahier-mobile-client-m11.md](cahier-mobile-client-m11.md) | Tâches ENV / DS / DEV / TEST |
| [standards-developpement.md](standards-developpement.md) | Conventions monorepo + §8 mobile |
| [guides/guide-mobile-client.md](guides/guide-mobile-client.md) | Routes & state |
| [guides/guide-ux-design.md](guides/guide-ux-design.md) | Personas, copy, principes UX |
| [spec-figma.md](spec-figma.md) | Spec tokens historique |
| [packages/ui-tokens](../packages/ui-tokens/src/index.ts) | Source couleurs / spacing |

---

## 11. Résumé en une phrase

**Tokens + primitifs stables + data API typée + états UI complets** = UI moderne qui évolue sans cascade de bugs.
