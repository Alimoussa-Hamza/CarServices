import {
  enableAndRegisterPush,
  resolvePushDeepLink,
} from '../push-notifications';
import { MOCK_EXPO_PUSH_TOKEN } from '../../data/push';

describe('push-notifications', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  it('mappe bookingId vers /bookings/:id', () => {
    expect(
      resolvePushDeepLink({
        bookingId: 'e1111111-1111-4111-8111-111111111501',
      }),
    ).toBe('/bookings/e1111111-1111-4111-8111-111111111501');
  });

  it('ignore payload vide', () => {
    expect(resolvePushDeepLink(null)).toBeNull();
    expect(resolvePushDeepLink({})).toBeNull();
  });

  it('enableAndRegisterPush mock réussit', async () => {
    const result = await enableAndRegisterPush();
    expect(result.ok).toBe(true);
    expect(result.token).toBe(MOCK_EXPO_PUSH_TOKEN);
  });
});
