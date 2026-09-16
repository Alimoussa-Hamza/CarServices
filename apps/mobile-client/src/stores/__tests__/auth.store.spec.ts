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
    });
  });

  it('persiste et hydrate une session', async () => {
    await useAuthStore.getState().setSession({
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: 100,
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        role: 'client',
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
    expect(state.user?.phone).toBe('+33612345678');
    expect(state.hydrated).toBe(true);
  });

  it('clearSession efface les tokens', async () => {
    await useAuthStore.getState().setSession({
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: 100,
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        role: 'client',
        phone: '+33600000000',
        email: null,
      },
    });
    await useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
