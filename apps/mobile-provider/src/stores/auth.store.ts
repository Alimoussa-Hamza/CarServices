import { create } from 'zustand';
import type { AuthUser, AuthTokensResponse, KycStatus } from '@carservice/shared-types';
import {
  clearToken,
  readToken,
  TOKEN_KEYS,
  writeToken,
} from '../lib/token-storage';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  kycStatus: KycStatus | null;
  chargesEnabled: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: AuthTokensResponse) => Promise<void>;
  setKycGate: (gate: { kycStatus: KycStatus; chargesEnabled: boolean }) => void;
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  hydrated: false,
  kycStatus: null,
  chargesEnabled: false,

  hydrate: async () => {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      readToken(TOKEN_KEYS.access),
      readToken(TOKEN_KEYS.refresh),
      readToken(TOKEN_KEYS.user),
    ]);

    let user: AuthUser | null = null;
    if (userJson) {
      try {
        user = JSON.parse(userJson) as AuthUser;
      } catch {
        user = null;
      }
    }

    set({
      accessToken,
      refreshToken,
      user,
      hydrated: true,
    });
  },

  setSession: async (session) => {
    await Promise.all([
      writeToken(TOKEN_KEYS.access, session.accessToken),
      writeToken(TOKEN_KEYS.refresh, session.refreshToken),
      writeToken(TOKEN_KEYS.user, JSON.stringify(session.user)),
    ]);
    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      hydrated: true,
    });
  },

  setKycGate: (gate) => {
    set({
      kycStatus: gate.kycStatus,
      chargesEnabled: gate.chargesEnabled,
    });
  },

  clearSession: async () => {
    await Promise.all([
      clearToken(TOKEN_KEYS.access),
      clearToken(TOKEN_KEYS.refresh),
      clearToken(TOKEN_KEYS.user),
    ]);
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: true,
      kycStatus: null,
      chargesEnabled: false,
    });
  },
}));

export function selectIsAuthenticated(state: AuthState): boolean {
  return Boolean(state.accessToken);
}
