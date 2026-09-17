import * as WebBrowser from 'expo-web-browser';
import { STRIPE_CONNECT_RETURN_URL } from '../data/connect';

export type StripeConnectBrowserResult = 'success' | 'cancel';

/** Opens Stripe-hosted Account Link. We never collect IBAN in-app. */
export async function openStripeConnectBrowser(
  url: string,
): Promise<StripeConnectBrowserResult> {
  WebBrowser.maybeCompleteAuthSession();
  const result = await WebBrowser.openAuthSessionAsync(
    url,
    STRIPE_CONNECT_RETURN_URL,
  );
  return result.type === 'success' ? 'success' : 'cancel';
}
