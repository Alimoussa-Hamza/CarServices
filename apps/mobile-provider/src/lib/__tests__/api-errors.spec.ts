import { ApiError } from '@carservice/api-client';
import { mapApiError } from '../api-errors';

describe('mapApiError', () => {
  it('affiche Code incorrect. pour OTP_INVALID', () => {
    expect(mapApiError(new ApiError('OTP_INVALID', 'x', 401))).toBe(
      'Code incorrect.',
    );
  });

  it('mappe une erreur Stripe Connect', () => {
    expect(mapApiError(new ApiError('STRIPE_REQUEST_FAILED', 'x', 503))).toBe(
      'Stripe est indisponible. Réessaie dans un instant.',
    );
  });

  it('mappe une mission déjà prise', () => {
    expect(
      mapApiError(new ApiError('BOOKING_ALREADY_ACCEPTED', 'x', 409)),
    ).toBe("Cette mission n'est plus disponible.");
  });

  it('mappe géofence et annulation mission', () => {
    expect(mapApiError(new ApiError('BOOKING_GEOFENCE_FAILED', 'x', 400))).toBe(
      'Rapprochez-vous du lieu (200 m) pour confirmer l’arrivée.',
    );
    expect(
      mapApiError(new ApiError('BOOKING_CANCEL_REASON_REQUIRED', 'x', 400)),
    ).toBe('Indiquez un motif d’annulation.');
  });
});
