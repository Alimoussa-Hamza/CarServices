import { env, parseUseMocks } from '../config/env';

export type PaymentSheetResult = 'success' | 'canceled' | 'failed';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

type StripeNative = {
  initPaymentSheet: (params: {
    paymentIntentClientSecret: string;
    merchantDisplayName: string;
  }) => Promise<{ error?: { code?: string; message?: string } }>;
  presentPaymentSheet: () => Promise<{
    error?: { code?: string; message?: string };
  }>;
};

function loadStripeNative(): StripeNative {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@stripe/stripe-react-native') as StripeNative;
}

/**
 * Present Stripe PaymentSheet when a publishable key is set and mocks are off.
 * Otherwise simulate a successful native sheet (Expo Go / mock mode).
 */
export async function presentPaymentSheetFlow(input: {
  clientSecret: string;
  forceFail?: boolean;
}): Promise<PaymentSheetResult> {
  if (useMocksNow() || !env.stripePublishableKey) {
    if (input.forceFail) {
      return 'failed';
    }
    return 'success';
  }

  const { initPaymentSheet, presentPaymentSheet } = loadStripeNative();

  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: input.clientSecret,
    merchantDisplayName: 'CarWash',
  });
  if (initError) {
    return 'failed';
  }

  const { error: presentError } = await presentPaymentSheet();
  if (!presentError) {
    return 'success';
  }
  if (presentError.code === 'Canceled') {
    return 'canceled';
  }
  return 'failed';
}

export async function runCheckoutPayment(input: {
  clientSecret: string;
  forceFail?: boolean;
}): Promise<PaymentSheetResult> {
  return presentPaymentSheetFlow(input);
}
