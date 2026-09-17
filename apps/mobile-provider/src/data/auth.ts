import { api, ApiError } from '@carservice/api-client';
import type { AuthTokensResponse, SendOtpResponse } from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import { MOCK_OTP_CODE, verifyMockOtp } from '../mocks/otp';
import { bootstrapApiClient } from './api-bootstrap';
import { normalizeFrPhone } from '../lib/phone';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

export async function sendOtp(phoneRaw: string): Promise<SendOtpResponse> {
  const phone = normalizeFrPhone(phoneRaw);

  if (useMocksNow()) {
    return { expiresIn: 300, retryAfter: null };
  }

  bootstrapApiClient();
  return api.auth.sendOtp({ phone, role: 'provider' });
}

export async function verifyOtp(input: {
  phoneRaw: string;
  code: string;
  acceptTerms: boolean;
}): Promise<AuthTokensResponse> {
  const phone = normalizeFrPhone(input.phoneRaw);

  if (!input.acceptTerms) {
    throw new ApiError('VALIDATION_ERROR', 'CGU requises', 400);
  }

  if (useMocksNow()) {
    if (!verifyMockOtp(input.code)) {
      throw new ApiError('OTP_INVALID', 'Code incorrect.', 401);
    }
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 86400,
      user: {
        id: '22222222-2222-4222-8222-222222222222',
        role: 'provider',
        phone,
        email: null,
      },
    };
  }

  bootstrapApiClient();
  return api.auth.verifyOtp({
    phone,
    code: input.code.trim(),
    acceptTerms: true,
  });
}

export { MOCK_OTP_CODE };
