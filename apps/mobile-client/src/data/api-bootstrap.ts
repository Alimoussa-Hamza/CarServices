import { initApiClient } from '@carservice/api-client';
import { env } from '../config/env';
import { readToken, TOKEN_KEYS } from '../lib/token-storage';

let bootstrapped = false;

export function bootstrapApiClient(): void {
  if (bootstrapped) {
    return;
  }
  initApiClient({
    baseUrl: env.apiUrl,
    getAccessToken: () => readToken(TOKEN_KEYS.access),
  });
  bootstrapped = true;
}

/** Test helper */
export function resetApiBootstrap(): void {
  bootstrapped = false;
}
