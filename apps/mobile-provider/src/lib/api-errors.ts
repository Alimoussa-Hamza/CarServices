import { ApiError } from '@carservice/api-client';

const FR_BY_CODE: Record<string, string> = {
  OTP_INVALID: 'Code incorrect.',
  OTP_RATE_LIMIT: 'Trop de tentatives. Réessaie dans quelques minutes.',
  AUTH_RATE_LIMIT: 'Trop de tentatives. Réessaie plus tard.',
  VALIDATION_ERROR: 'Vérifie les informations saisies.',
  ZONE_UNCOVERED: 'Cette adresse n’est pas encore couverte.',
  NETWORK_ERROR: 'Connexion impossible. Vérifie ton réseau.',
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
