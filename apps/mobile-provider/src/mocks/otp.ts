/** Fixed OTP for mock auth (never production). */
export const MOCK_OTP_CODE = '000000';

export function verifyMockOtp(code: string): boolean {
  return code.trim() === MOCK_OTP_CODE;
}
