import { fetchKycGate } from '../data/kyc';
import { resolveSessionRoute } from './session-gate';
import { useAuthStore } from '../stores/auth.store';

export async function syncKycAndResolveRoute(): Promise<ReturnType<typeof resolveSessionRoute>> {
  const authenticated = Boolean(useAuthStore.getState().accessToken);
  if (!authenticated) {
    return resolveSessionRoute({
      authenticated: false,
      kycStatus: null,
      chargesEnabled: false,
    });
  }

  const gate = await fetchKycGate();
  useAuthStore.getState().setKycGate(gate);
  return resolveSessionRoute({
    authenticated: true,
    kycStatus: gate.kycStatus,
    chargesEnabled: gate.chargesEnabled,
  });
}
