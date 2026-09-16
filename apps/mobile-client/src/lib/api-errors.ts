import { ApiError } from '@carservice/api-client';

const FR_BY_CODE: Record<string, string> = {
  OTP_INVALID: 'Code incorrect.',
  OTP_RATE_LIMIT: 'Trop de tentatives. Réessaie dans quelques minutes.',
  AUTH_RATE_LIMIT: 'Trop de tentatives. Réessaie plus tard.',
  VALIDATION_ERROR: 'Vérifie les informations saisies.',
  PAYMENT_FAILED: 'Paiement refusé. Réessaie ou change de carte.',
  ZONE_NOT_COVERED: 'Cette adresse est hors zone.',
  REVIEW_ALREADY_EXISTS: 'Tu as déjà laissé un avis pour cette mission.',
  REVIEW_WINDOW_EXPIRED: 'La fenêtre de 72 h pour laisser un avis est terminée.',
  REVIEW_BOOKING_NOT_COMPLETED: 'Avis possible uniquement après une mission terminée.',
  BOOKING_NOT_FOUND: 'Réservation introuvable.',
  NETWORK_ERROR: 'Connexion impossible. Vérifie ton réseau.',
  UNKNOWN_ERROR: 'Une erreur est survenue. Réessaie.',
};

export function mapApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return FR_BY_CODE[error.code] ?? error.message ?? FR_BY_CODE.UNKNOWN_ERROR;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return FR_BY_CODE.UNKNOWN_ERROR;
}

export function apiErrorCodes(): string[] {
  return Object.keys(FR_BY_CODE);
}
