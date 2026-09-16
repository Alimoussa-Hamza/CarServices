import {
  initPaymentSheet,
  presentPaymentSheet,
} from '@stripe/stripe-react-native';
import { env, parseUseMocks } from '../config/env';

export type PaymentSheetResult = 'success' | 'canceled' | 'failed';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
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
