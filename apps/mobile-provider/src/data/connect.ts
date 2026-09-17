import { api } from '@carservice/api-client';
import { env, parseUseMocks } from '../config/env';
import { bootstrapApiClient } from './api-bootstrap';
import { enableMockCharges, fetchKycGate, type KycGate } from './kyc';

export const STRIPE_CONNECT_RETURN_URL =
  'https://pro.carservice.test/stripe/return';
export const STRIPE_CONNECT_REFRESH_URL =
  'https://pro.carservice.test/stripe/refresh';
export const MOCK_STRIPE_ONBOARD_URL =
  'https://connect.stripe.com/setup/s/acct_mock';
export const MOCK_STRIPE_ACCOUNT_ID = 'acct_mock';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

export type StripeOnboardingLink = {
  url: string;
  stripeAccountId: string;
};

export async function startConnectOnboarding(): Promise<StripeOnboardingLink> {
  if (useMocksNow()) {
    return {
      url: MOCK_STRIPE_ONBOARD_URL,
      stripeAccountId: MOCK_STRIPE_ACCOUNT_ID,
    };
  }

  bootstrapApiClient();
  return api.providers.createStripeOnboardingLink({
    returnUrl: STRIPE_CONNECT_RETURN_URL,
    refreshUrl: STRIPE_CONNECT_REFRESH_URL,
  });
}

/** After Stripe Account Link returns — re-fetch eligibility, never skip Connect. */
export async function applyConnectSuccess(): Promise<KycGate> {
  if (useMocksNow()) {
    enableMockCharges();
    return fetchKycGate();
  }

  bootstrapApiClient();
  try {
    await api.providers.missionEligibility();
  } catch {
    // 403 STRIPE_CHARGES_DISABLED until webhook — gate still from me()
  }
  return fetchKycGate();
}
