import { ApiError } from '@carservice/api-client';
import { sendOtp, verifyOtp } from '../auth';

describe('auth repository (mock provider)', () => {
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

  it('verifyOtp refuse un mauvais code avec OTP_INVALID', async () => {
    await expect(
      verifyOtp({ phoneRaw: '0612345678', code: '111111', acceptTerms: true }),
    ).rejects.toMatchObject({ code: 'OTP_INVALID' });
    await expect(
      verifyOtp({ phoneRaw: '0612345678', code: '111111', acceptTerms: true }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('verifyOtp refuse sans CGU', async () => {
    await expect(
      verifyOtp({ phoneRaw: '0612345678', code: '000000', acceptTerms: false }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('verifyOtp accepte 000000 en rôle provider', async () => {
    const session = await verifyOtp({
      phoneRaw: '0612345678',
      code: '000000',
      acceptTerms: true,
    });
    expect(session.user.role).toBe('provider');
    expect(session.user.phone).toBe('+33612345678');
  });
});
