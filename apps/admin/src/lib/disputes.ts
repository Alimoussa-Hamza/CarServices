import type {
  AdminResolveDisputeDecision,
  DisputeOpenedBy,
  DisputeReason,
  DisputeStatus,
} from '@carservice/shared-types';

const OPEN_DISPUTE_STATUSES: readonly DisputeStatus[] = [
  'open',
  'under_review',
];

const RESOLVED_DISPUTE_STATUSES: DisputeStatus[] = [
  'resolved_client',
  'resolved_provider',
  'resolved_split',
  'closed',
];

const REASON_FR: Record<DisputeReason, string> = {
  quality: 'Qualité',
  delay: 'Retard',
  damage: 'Dégât',
  no_show: 'No-show',
  other: 'Autre',
};

const STATUS_FR: Record<DisputeStatus, string> = {
  open: 'Ouvert',
  under_review: 'En revue',
  resolved_client: 'Tranché client',
  resolved_provider: 'Tranché pro',
  resolved_split: 'Partage',
  closed: 'Clos',
};

const OPENED_BY_FR: Record<DisputeOpenedBy, string> = {
  client: 'Client',
  provider: 'Pro',
};

export const ADMIN_DISPUTES_PAGE_SIZE = 20;

export const ADMIN_DISPUTE_STATUS_FILTERS: Array<{
  value: '' | 'resolved' | DisputeStatus;
  label: string;
}> = [
  { value: '', label: 'Ouverts' },
  { value: 'resolved', label: 'Résolus' },
  { value: 'open', label: 'Ouvert' },
  { value: 'under_review', label: 'En revue' },
  { value: 'resolved_client', label: 'Tranché client' },
  { value: 'resolved_provider', label: 'Tranché pro' },
  { value: 'resolved_split', label: 'Partage' },
  { value: 'closed', label: 'Clos' },
];

export const RESOLVE_DECISIONS: Array<{
  value: AdminResolveDisputeDecision;
  label: string;
  hint: string;
  variant: 'danger' | 'primary' | 'secondary';
  notesRequired: boolean;
}> = [
  {
    value: 'resolved_client',
    label: 'Rembourser le client',
    hint: 'Refund / cancel auth + dégel payout',
    variant: 'danger',
    notesRequired: false,
  },
  {
    value: 'resolved_provider',
    label: 'Payer le pro',
    hint: 'Dégel payout, pas de refund',
    variant: 'primary',
    notesRequired: false,
  },
  {
    value: 'resolved_split',
    label: 'Partage',
    hint: 'Dégel payout · notes obligatoires',
    variant: 'secondary',
    notesRequired: true,
  },
];

export function statusesFromFilter(
  filter: '' | 'resolved' | DisputeStatus,
): DisputeStatus[] | undefined {
  if (filter === '') {
    return undefined;
  }
  if (filter === 'resolved') {
    return [...RESOLVED_DISPUTE_STATUSES];
  }
  return [filter];
}

export function isOpenDispute(status: DisputeStatus): boolean {
  return OPEN_DISPUTE_STATUSES.includes(status);
}

export function parseResolveNotes(
  raw: string,
  required: boolean,
): string | null | undefined {
  const notes = raw.trim();
  if (notes.length === 0) {
    return required ? null : undefined;
  }
  if (notes.length < 5 || notes.length > 2000) {
    return null;
  }
  return notes;
}

export function formatDisputeReasonFr(reason: DisputeReason): string {
  return REASON_FR[reason] ?? reason;
}

export function formatDisputeStatusFr(status: DisputeStatus): string {
  return STATUS_FR[status] ?? status;
}

export function formatOpenedByFr(openedBy: DisputeOpenedBy): string {
  return OPENED_BY_FR[openedBy] ?? openedBy;
}

export function formatPaymentActionFr(action: string): string {
  const labels: Record<string, string> = {
    canceled_authorization: 'auth annulée',
    refunded: 'remboursé',
    partial_capture: 'capture partielle',
    noop: 'aucun',
    unfrozen: 'payout dégelé',
  };
  return labels[action] ?? action;
}
