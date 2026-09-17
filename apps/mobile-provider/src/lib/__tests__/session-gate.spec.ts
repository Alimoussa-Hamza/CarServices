import { resolveSessionRoute } from '../session-gate';

describe('resolveSessionRoute', () => {
  it('envoie vers login si non connecté', () => {
    expect(
      resolveSessionRoute({
        authenticated: false,
        kycStatus: 'approved',
        chargesEnabled: true,
      }),
    ).toBe('/(auth)/login');
  });

  it('bloque les tabs tant que KYC draft', () => {
    expect(
      resolveSessionRoute({
        authenticated: true,
        kycStatus: 'draft',
        chargesEnabled: false,
      }),
    ).toBe('/(kyc)/start');
  });

  it('pending / rejected / connect avant missions', () => {
    expect(
      resolveSessionRoute({
        authenticated: true,
        kycStatus: 'submitted',
        chargesEnabled: false,
      }),
    ).toBe('/(kyc)/pending');
    expect(
      resolveSessionRoute({
        authenticated: true,
        kycStatus: 'rejected',
        chargesEnabled: false,
      }),
    ).toBe('/(kyc)/rejected');
    expect(
      resolveSessionRoute({
        authenticated: true,
        kycStatus: 'approved',
        chargesEnabled: false,
      }),
    ).toBe('/(kyc)/connect');
  });

  it('ouvre Missions seulement si approved + chargesEnabled', () => {
    expect(
      resolveSessionRoute({
        authenticated: true,
        kycStatus: 'approved',
        chargesEnabled: true,
      }),
    ).toBe('/(tabs)/missions');
  });
});
