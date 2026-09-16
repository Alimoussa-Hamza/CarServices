import { verifyMockOtp, MOCK_OTP_CODE } from '../otp';

describe('mock otp', () => {
  it('accepte le code fixe mock', () => {
    expect(verifyMockOtp(MOCK_OTP_CODE)).toBe(true);
    expect(verifyMockOtp(` ${MOCK_OTP_CODE} `)).toBe(true);
  });

  it('refuse un code invalide', () => {
    expect(verifyMockOtp('123456')).toBe(false);
  });
});
