import type {
  BookingActorType,
  BookingStatus,
  PaymentStatus,
} from '@carservice/shared-types';

const REFUNDABLE_PAYMENTS: readonly PaymentStatus[] = [
  'authorized',
  'captured',
];

const ADMIN_CANCEL_STATUSES: readonly BookingStatus[] = [
  'draft',
  'payment_authorized',
  'pending_provider',
  'accepted',
  'en_route',
];

const PAYMENT_STATUS_FR: Record<PaymentStatus, string> = {
  authorized: 'Pré-autorisé',
  captured: 'Capturé',
  refunded: 'Remboursé',
  failed: 'Échoué',
};

const ACTOR_FR: Record<BookingActorType, string> = {
  client: 'Client',
  provider: 'Pro',
  admin: 'Admin',
  system: 'Système',
};

export const ADMIN_BOOKING_STATUS_FILTERS: Array<{
  value: '' | BookingStatus;
  label: string;
}> = [
  { value: '', label: 'Tous (hors brouillon)' },
  { value: 'payment_authorized', label: 'Paiement autorisé' },
  { value: 'pending_provider', label: 'En matching' },
  { value: 'accepted', label: 'Accepté' },
  { value: 'en_route', label: 'En route' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'unassigned', label: 'Non assigné' },
  { value: 'expired', label: 'Expiré' },
  { value: 'cancelled_by_client', label: 'Annulé client' },
  { value: 'cancelled_by_provider', label: 'Annulé pro' },
  { value: 'cancelled_by_admin', label: 'Annulé admin' },
  { value: 'disputed', label: 'Litige' },
];

export const ADMIN_BOOKINGS_PAGE_SIZE = 20;

export function parseBookingsSearchQuery(raw: string): string | undefined {
  const query = raw.trim();
  if (query.length === 0) {
    return undefined;
  }
  return query.slice(0, 100);
}

export function parseRefundReason(raw: string): string | null | undefined {
  const reason = raw.trim();
  if (reason.length === 0) {
    return undefined;
  }
  if (reason.length < 3 || reason.length > 300) {
    return null;
  }
  return reason;
}

export function isPaymentRefundable(
  paymentStatus: PaymentStatus | null,
): boolean {
  return (
    paymentStatus !== null && REFUNDABLE_PAYMENTS.includes(paymentStatus)
  );
}

/** RG-BOOK-01 : cancel admin avant `in_progress`. */
export function willCancelByAdmin(status: BookingStatus): boolean {
  return ADMIN_CANCEL_STATUSES.includes(status);
}

export function formatPaymentStatusFr(
  status: PaymentStatus | null,
): string {
  if (!status) {
    return '—';
  }
  return PAYMENT_STATUS_FR[status] ?? status;
}

export function formatActorTypeFr(actor: BookingActorType): string {
  return ACTOR_FR[actor] ?? actor;
}

export function formatClientName(client: {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}): string {
  const name = [client.firstName, client.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .trim();
  return name || client.phone || 'Client';
}

export function formatSlotRange(slotStart: string, slotEnd: string): string {
  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  const date = start.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const from = start.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const to = end.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} ${from}–${to}`;
}
