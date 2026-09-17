import { resetMemoryTokenStore } from '../../lib/token-storage';
import { useAuthStore } from '../auth.store';

describe('auth store', () => {
  beforeEach(() => {
    resetMemoryTokenStore();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,
      kycStatus: null,
      chargesEnabled: false,
    });
  });

  it('persiste et hydrate une session provider', async () => {
    await useAuthStore.getState().setSession({
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: 100,
      user: {
        id: '22222222-2222-4222-8222-222222222222',
        role: 'provider',
        phone: '+33612345678',
        email: null,
      },
    });

    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,
    });

    await useAuthStore.getState().hydrate();
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('a');
    expect(state.user?.role).toBe('provider');
    expect(state.hydrated).toBe(true);
  });

  it('clearSession efface les tokens', async () => {
    await useAuthStore.getState().setSession({
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: 100,
      user: {
        id: '22222222-2222-4222-8222-222222222222',
        role: 'provider',
        phone: '+33600000000',
        email: null,
      },
    });
    await useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
