/**
 * Public Expo env — no secrets.
 * Toggle mocks without scattering `if (dev)` in screens.
 */
export function parseUseMocks(
  value: string | undefined,
  fallback = true,
): boolean {
  if (value === undefined || value === '') {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3000',
  useMocks: parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, true),
} as const;

export type AppEnv = typeof env;
