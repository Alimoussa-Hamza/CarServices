import { resetMockKycGate, submitKycDossier } from '../../data/kyc';
import { EMPTY_KYC_DRAFT } from '../kyc-validation';
import { resetMemoryTokenStore } from '../token-storage';
import { useAuthStore } from '../../stores/auth.store';
import { syncKycAndResolveRoute } from '../sync-session';

describe('syncKycAndResolveRoute (mock)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    resetMockKycGate();
    resetMemoryTokenStore();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: true,
      kycStatus: null,
      chargesEnabled: false,
    });
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = originalEnv;
  });

  it('login si pas de session', async () => {
    await expect(syncKycAndResolveRoute()).resolves.toBe('/(auth)/login');
  });

  it('KYC wizard si connecté en mock (draft)', async () => {
    useAuthStore.setState({ accessToken: 'a' });
    await expect(syncKycAndResolveRoute()).resolves.toBe('/(kyc)/wizard/1');
    expect(useAuthStore.getState().kycStatus).toBe('draft');
  });

  it('pending après submit mock — pas de tabs', async () => {
    useAuthStore.setState({ accessToken: 'a' });
    await submitKycDossier({
      ...EMPTY_KYC_DRAFT,
      companyName: 'Marc Dubois AE',
      siret: '81234567800021',
      rcSelected: true,
      rcExpiresAt: '2099-12-31',
      waterless: true,
      zoneAddress: '12 rue de la République, 69002 Lyon',
      formulas: ['complet'],
      hasPortrait: true,
    });
    await expect(syncKycAndResolveRoute()).resolves.toBe('/(kyc)/pending');
    expect(useAuthStore.getState().kycStatus).toBe('submitted');
  });
});
