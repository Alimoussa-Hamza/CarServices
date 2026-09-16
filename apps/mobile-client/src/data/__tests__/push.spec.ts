import { MOCK_EXPO_PUSH_TOKEN, registerPushToken } from '../push';

describe('registerPushToken (mock)', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  it('enregistre un token Expo mock', async () => {
    const res = await registerPushToken({
      token: MOCK_EXPO_PUSH_TOKEN,
      platform: 'ios',
    });
    expect(res.token).toBe(MOCK_EXPO_PUSH_TOKEN);
    expect(res.platform).toBe('ios');
    expect(res.id).toBeTruthy();
  });
});
