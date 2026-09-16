import { ApiError } from '@carservice/api-client';
import { sendOtp, verifyOtp } from '../auth';

describe('auth repository (mock)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = originalEnv;
  });

  it('sendOtp réussit en mock', async () => {
    await expect(sendOtp('0612345678')).resolves.toMatchObject({ expiresIn: 300 });
  });

  it('verifyOtp refuse un mauvais code', async () => {
    await expect(
      verifyOtp({ phoneRaw: '0612345678', code: '111111', acceptTerms: true }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('verifyOtp accepte 000000 et renvoie une session', async () => {
    const session = await verifyOtp({
      phoneRaw: '0612345678',
      code: '000000',
      acceptTerms: true,
    });
    expect(session.accessToken).toBeTruthy();
    expect(session.user.role).toBe('client');
    expect(session.user.phone).toBe('+33612345678');
  });
});
