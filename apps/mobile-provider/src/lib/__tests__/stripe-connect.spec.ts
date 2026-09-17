import * as WebBrowser from 'expo-web-browser';
import { STRIPE_CONNECT_RETURN_URL } from '../../data/connect';
import { openStripeConnectBrowser } from '../stripe-connect';

describe('openStripeConnectBrowser', () => {
  it('ouvre la page Stripe et mappe success', async () => {
    const open = WebBrowser.openAuthSessionAsync as jest.Mock;
    open.mockResolvedValueOnce({ type: 'success', url: STRIPE_CONNECT_RETURN_URL });

    await expect(
      openStripeConnectBrowser('https://connect.stripe.com/setup/s/acct_1'),
    ).resolves.toBe('success');
    expect(open).toHaveBeenCalledWith(
      'https://connect.stripe.com/setup/s/acct_1',
      STRIPE_CONNECT_RETURN_URL,
    );
  });

  it('mappe cancel si l’utilisateur ferme le navigateur', async () => {
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
      type: 'cancel',
    });
    await expect(
      openStripeConnectBrowser('https://connect.stripe.com/setup/s/acct_1'),
    ).resolves.toBe('cancel');
  });
});
