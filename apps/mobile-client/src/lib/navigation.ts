import { router, type Href } from 'expo-router';

export function goBackOr(fallback: Href = '/(tabs)'): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
