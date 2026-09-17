import type { BookingStatus } from '@carservice/shared-types';

const BOOKING_STATUS_FR: Record<BookingStatus, string> = {
  draft: 'Brouillon',
  payment_authorized: 'Paiement autorisé',
  pending_provider: 'En matching',
  accepted: 'Accepté',
  en_route: 'En route',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled_by_client: 'Annulé client',
  cancelled_by_provider: 'Annulé pro',
  cancelled_by_admin: 'Annulé admin',
  expired: 'Expiré',
  unassigned: 'Non assigné',
  disputed: 'Litige',
};

export function formatEurFromCents(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')} %`;
}

export function formatDelayMinutes(minutes: number | null): string {
  if (minutes === null) {
    return '—';
  }
  const rounded = Math.round(minutes * 10) / 10;
  return `${String(rounded).replace('.', ',')} min`;
}

export function formatBookingStatusFr(status: BookingStatus): string {
  return BOOKING_STATUS_FR[status] ?? status;
}

export function sumBookingCounts(
  rows: Array<{ count: number }>,
): number {
  return rows.reduce((total, row) => total + row.count, 0);
}

export function gmvBarHeights(
  amounts: number[],
  maxPx: number,
): number[] {
  const peak = Math.max(0, ...amounts);
  if (peak === 0) {
    return amounts.map(() => 2);
  }
  return amounts.map((amount) =>
    Math.max(2, Math.round((amount / peak) * maxPx)),
  );
}
