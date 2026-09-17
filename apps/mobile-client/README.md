# CarWash Client — Expo 52

App mobile client CarWash (`apps/mobile-client`).

## Docs

- Tâches : [docs/cahier-mobile-client-m11.md](../../docs/cahier-mobile-client-m11.md)
- Bonnes pratiques UI : [docs/cahier-bonnes-pratiques-ui.md](../../docs/cahier-bonnes-pratiques-ui.md)
- Maquettes : [docs/ux/maquettes-client-carwash.pdf](../../docs/ux/maquettes-client-carwash.pdf)

## Dev

```bash
cp .env.example .env
pnpm --filter @carservice/mobile-client dev
```

`EXPO_PUBLIC_USE_MOCKS=true` → repositories mock (pas d’API).  
`false` → `@carservice/api-client` (`EXPO_PUBLIC_API_URL`).

Preview EAS (APK / TestFlight) : [docs/runbooks/eas-preview.md](../../docs/runbooks/eas-preview.md).

## Structure

```
app/                 # Expo Router (Splash, tabs, auth stub)
src/components/ui/   # Primitifs (Button, ErrorBanner…)
src/theme/           # ThemeProvider ← @carservice/ui-tokens
src/mocks/           # Données mock
src/data/            # Accès mock | API
```
