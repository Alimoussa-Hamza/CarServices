import { ApiError } from '@carservice/api-client';
import { mapApiError } from '../api-errors';

describe('mapApiError', () => {
  it('affiche Code incorrect. pour OTP_INVALID', () => {
    expect(mapApiError(new ApiError('OTP_INVALID', 'x', 401))).toBe(
      'Code incorrect.',
    );
  });
});
