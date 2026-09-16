import { presentPaymentSheetFlow } from '../payment-sheet';

describe('presentPaymentSheetFlow', () => {
  const originalMocks = process.env.EXPO_PUBLIC_USE_MOCKS;
  const originalKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  afterEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = originalMocks;
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalKey;
  });

  it('succès en mode mock', async () => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    await expect(
      presentPaymentSheetFlow({ clientSecret: 'pi_mock' }),
    ).resolves.toBe('success');
  });

  it('échec forcé en mock', async () => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    await expect(
      presentPaymentSheetFlow({ clientSecret: 'pi_mock', forceFail: true }),
    ).resolves.toBe('failed');
  });
});
