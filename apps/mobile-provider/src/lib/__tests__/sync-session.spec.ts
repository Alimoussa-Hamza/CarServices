import { resetMemoryTokenStore } from '../token-storage';
import { useAuthStore } from '../../stores/auth.store';
import { syncKycAndResolveRoute } from '../sync-session';

describe('syncKycAndResolveRoute (mock)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
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

  it('KYC start si connecté en mock (draft)', async () => {
    useAuthStore.setState({ accessToken: 'a' });
    await expect(syncKycAndResolveRoute()).resolves.toBe('/(kyc)/start');
    expect(useAuthStore.getState().kycStatus).toBe('draft');
  });
});
