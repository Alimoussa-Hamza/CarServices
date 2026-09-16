import { ApiError } from '@carservice/api-client';
import { apiErrorCodes, mapApiError } from '../api-errors';

describe('mapApiError', () => {
  it('mappe OTP_INVALID en copy FR', () => {
    expect(mapApiError(new ApiError('OTP_INVALID', 'x', 401))).toBe('Code incorrect.');
  });

  it('mappe OTP_RATE_LIMIT', () => {
    expect(mapApiError(new ApiError('OTP_RATE_LIMIT', 'x', 429))).toContain('Trop de tentatives');
  });

  it('expose les codes couverts', () => {
    expect(apiErrorCodes()).toEqual(
      expect.arrayContaining(['OTP_INVALID', 'OTP_RATE_LIMIT', 'VALIDATION_ERROR']),
    );
  });
});
