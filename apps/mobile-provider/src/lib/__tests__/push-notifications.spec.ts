import {
  enableAndRegisterPush,
  playMissionPing,
  resolveProviderPushDeepLink,
} from '../push-notifications';
import { MOCK_EXPO_PUSH_TOKEN } from '../../data/push';

describe('provider push', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  it('tap notif → P03, ignore si P04/P05', () => {
    expect(
      resolveProviderPushDeepLink({
        bookingId: 'a1111111-1111-4111-8111-111111111101',
      }),
    ).toBe('/missions/a1111111-1111-4111-8111-111111111101');
    expect(
      resolveProviderPushDeepLink(
        { bookingId: 'a1111111-1111-4111-8111-111111111101' },
        '/missions/x/active',
      ),
    ).toBeNull();
    expect(
      resolveProviderPushDeepLink(
        { bookingId: 'a1111111-1111-4111-8111-111111111101' },
        '/missions/x/execute',
      ),
    ).toBeNull();
  });

  it('mock register sans EXPO_ACCESS_TOKEN', async () => {
    const result = await enableAndRegisterPush();
    expect(result.ok).toBe(true);
    expect(result.token).toBe(MOCK_EXPO_PUSH_TOKEN);
  });

  it('1 ping court seulement si Son on', () => {
    expect(playMissionPing(true)).toBe('ping');
    expect(playMissionPing(false)).toBe('silent');
  });
});
