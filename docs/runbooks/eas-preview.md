# Runbook — EAS preview (TestFlight + APK)

> Story **CS-M14-S03** / tâche **N16**. Expo SDK **52** (pas de saut 57).  
> Commandes depuis le dossier de l’app, pas la racine du monorepo.

## Prérequis (humain)

1. Compte [Expo](https://expo.dev) + `npx eas-cli@16 login`
2. Apple Developer (99 €/an) + app créée dans App Store Connect  
   - Client : `fr.carservice.client`  
   - Pro : `fr.carservice.provider`
3. (Android APK) pas besoin de Play Console. Play Store = N18.
4. URL API **publique** (staging). Un IPA/APK ne peut pas joindre `127.0.0.1`.

```bash
# Dans chaque projet Expo (client puis pro), une fois le projet créé :
npx eas-cli@16 init
npx eas-cli@16 env:create --name EXPO_PUBLIC_API_URL --value https://api-staging.carservice.fr --environment preview
npx eas-cli@16 env:create --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value pk_test_xxx --environment preview
```

Ne jamais committer de secrets. Les `EXPO_PUBLIC_*` hors URL/mocks vont dans EAS Env, pas dans `eas.json`.

## Builds preview

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 20

# Client — APK interne
cd apps/mobile-client
npx eas-cli@16 build --profile preview --platform android --non-interactive

# Client — iOS TestFlight (après credentials Apple)
npx eas-cli@16 build --profile preview --platform ios --non-interactive
npx eas-cli@16 submit --profile preview --platform ios --latest --non-interactive

# Pro — même couple
cd ../mobile-provider
npx eas-cli@16 build --profile preview --platform android --non-interactive
npx eas-cli@16 build --profile preview --platform ios --non-interactive
npx eas-cli@16 submit --profile preview --platform ios --latest --non-interactive
```

`eas init` écrit `extra.eas.projectId` dans `app.json` — committer cet id (ce n’est pas un secret).

## Profiles (`eas.json`)

| Profile | Android | iOS |
|---------|---------|-----|
| `development` | Dev client interne | Dev client interne |
| `preview` | APK interne | Store → TestFlight via `eas submit` |
| `production` | AAB store (N18) | Store (N18) |

Monorepo : hook `eas-build-post-install` compile `@carservice/shared-types` (`dist/` gitignoré).

## Vérifier

- [ ] Lien APK téléchargeable (page EAS)
- [ ] Build iOS `Finished` + TestFlight « Processing » puis installable
- [ ] App pointe vers l’API staging (`EXPO_PUBLIC_USE_MOCKS=false`)
- [ ] OTP / Stripe **test** (pas live)

Ensuite : **N17** SC-01…06 manuels staging.
