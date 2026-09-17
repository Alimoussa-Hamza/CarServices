import { ApiError } from '@carservice/api-client';

const FR_BY_CODE: Record<string, string> = {
  OTP_INVALID: 'Code incorrect.',
  OTP_RATE_LIMIT: 'Trop de tentatives. Réessaie dans quelques minutes.',
  AUTH_RATE_LIMIT: 'Trop de tentatives. Réessaie plus tard.',
  VALIDATION_ERROR: 'Vérifie les informations saisies.',
  ZONE_UNCOVERED: 'Cette adresse n’est pas encore couverte.',
  STRIPE_REQUEST_FAILED: 'Stripe est indisponible. Réessaie dans un instant.',
  STRIPE_ACCOUNT_CREATE_FAILED: 'Impossible de créer le compte virements.',
  STRIPE_ACCOUNT_LINK_FAILED: 'Impossible d’ouvrir l’onboarding Stripe.',
  STRIPE_CHARGES_DISABLED: 'Activez les virements pour recevoir des missions.',
  NETWORK_ERROR: 'Connexion impossible. Vérifie ton réseau.',
  BOOKING_ALREADY_ACCEPTED: "Cette mission n'est plus disponible.",
  BOOKING_NOT_OFFERED: "Cette mission ne vous est plus proposée.",
  BOOKING_NOT_FOUND: 'Mission introuvable.',
  BOOKING_NOT_ASSIGNED: 'Cette mission ne vous est plus assignée.',
  BOOKING_INVALID_TRANSITION: 'Cette étape n’est plus possible.',
  BOOKING_GEOFENCE_FAILED: 'Rapprochez-vous du lieu (200 m) pour confirmer l’arrivée.',
  BOOKING_CANCEL_REASON_REQUIRED: 'Indiquez un motif d’annulation.',
  BOOKING_CANCEL_VIA_DISPUTE: 'La mission a déjà commencé. Contactez le support.',
  UNKNOWN_ERROR: 'Une erreur est survenue. Réessaie.',
};

export function mapApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'OTP_INVALID') {
      return 'Code incorrect.';
    }
    return FR_BY_CODE[error.code] ?? error.message ?? FR_BY_CODE.UNKNOWN_ERROR;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return FR_BY_CODE.UNKNOWN_ERROR;
}
