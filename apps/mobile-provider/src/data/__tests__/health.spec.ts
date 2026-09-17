import { env } from '../../config/env';
import { getHealthStatus } from '../health';

describe('getHealthStatus', () => {
  it('renvoie mock prêt quand EXPO_PUBLIC_USE_MOCKS est actif (défaut tests)', async () => {
    expect(env.useMocks).toBe(true);
    await expect(getHealthStatus()).resolves.toEqual({
      label: 'mock prêt',
      source: 'mock',
    });
  });
});
