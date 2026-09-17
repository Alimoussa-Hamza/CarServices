import type { KycStatus } from '@carservice/shared-types';

export type SessionRoute =
  | '/(auth)/login'
  | '/(kyc)/start'
  | '/(kyc)/pending'
  | '/(kyc)/rejected'
  | '/(kyc)/connect'
  | '/(tabs)/missions';

/**
 * Where Marc lands. Tabs only if KYC approved AND Connect charges_enabled.
 * Status comes from API — no booking logic here.
 */
export function resolveSessionRoute(input: {
  authenticated: boolean;
  kycStatus: KycStatus | null;
  chargesEnabled: boolean;
}): SessionRoute {
  if (!input.authenticated) {
    return '/(auth)/login';
  }
  if (input.kycStatus === 'submitted') {
    return '/(kyc)/pending';
  }
  if (input.kycStatus === 'rejected') {
    return '/(kyc)/rejected';
  }
  if (input.kycStatus === 'approved' && input.chargesEnabled) {
    return '/(tabs)/missions';
  }
  if (input.kycStatus === 'approved') {
    return '/(kyc)/connect';
  }
  return '/(kyc)/start';
}
