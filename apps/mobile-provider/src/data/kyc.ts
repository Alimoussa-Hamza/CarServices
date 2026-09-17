import { api } from '@carservice/api-client';
import type { KycStatus } from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import { bootstrapApiClient } from './api-bootstrap';

export type KycGate = {
  kycStatus: KycStatus;
  chargesEnabled: boolean;
};

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

/** Mock = new pro, dossier not submitted. API = kyc/status + me.chargesEnabled. */
export async function fetchKycGate(): Promise<KycGate> {
  if (useMocksNow()) {
    return { kycStatus: 'draft', chargesEnabled: false };
  }

  bootstrapApiClient();
  const [status, me] = await Promise.all([
    api.providers.kycStatus(),
    api.providers.me(),
  ]);
  return {
    kycStatus: status.status,
    chargesEnabled: me.chargesEnabled,
  };
}
