import type { BookingStatus, BookingTimelineEvent } from '@carservice/shared-types';

/** Aligné RG-CANCEL / CANCEL_FREE_HOURS (@carservice/shared-types). */
const CANCEL_FREE_HOURS = 24;

export type ClientTimelineStepKey =
  | 'confirmed'
  | 'provider'
  | 'en_route'
  | 'in_progress'
  | 'completed';

export type ClientTimelineStepState = 'done' | 'current' | 'upcoming';

export type ClientTimelineStep = {
  key: ClientTimelineStepKey;
  label: string;
  state: ClientTimelineStepState;
  at: string | null;
};

const STEP_KEYS: ClientTimelineStepKey[] = [
  'confirmed',
  'provider',
  'en_route',
  'in_progress',
  'completed',
];

const STATUS_TO_TO_STATUS: Partial<Record<ClientTimelineStepKey, BookingStatus[]>> = {
  confirmed: ['payment_authorized', 'pending_provider'],
  provider: ['accepted'],
  en_route: ['en_route'],
  in_progress: ['in_progress'],
  completed: ['completed'],
};

function providerLabel(status: BookingStatus): string {
  if (
    status === 'accepted' ||
    status === 'en_route' ||
    status === 'in_progress' ||
    status === 'completed'
  ) {
    return 'Pro confirmé';
  }
  if (status === 'unassigned' || status === 'expired') {
    return 'Aucun pro disponible';
  }
  return "Recherche d'un pro…";
}

function stepLabel(key: ClientTimelineStepKey, status: BookingStatus): string {
  switch (key) {
    case 'confirmed':
      return 'Confirmé';
    case 'provider':
      return providerLabel(status);
    case 'en_route':
      return 'En route';
    case 'in_progress':
      return 'Lavage en cours';
    case 'completed':
      return 'Terminé';
  }
}

/**
 * Maps API booking status → client timeline progress (C10).
 * Display-only — no business transitions on mobile.
 */
export function resolveTimelineProgress(status: BookingStatus): {
  doneThrough: number;
  currentIndex: number | null;
} {
  switch (status) {
    case 'draft':
    case 'payment_authorized':
    case 'pending_provider':
      return { doneThrough: 0, currentIndex: 1 };
    case 'accepted':
      return { doneThrough: 1, currentIndex: null };
    case 'en_route':
      return { doneThrough: 1, currentIndex: 2 };
    case 'in_progress':
      return { doneThrough: 2, currentIndex: 3 };
    case 'completed':
      return { doneThrough: 4, currentIndex: null };
    case 'unassigned':
    case 'expired':
      return { doneThrough: 0, currentIndex: 1 };
    case 'cancelled_by_client':
    case 'cancelled_by_provider':
    case 'cancelled_by_admin':
    case 'disputed':
      return { doneThrough: 0, currentIndex: null };
  }
}

function findEventAt(
  events: BookingTimelineEvent[],
  key: ClientTimelineStepKey,
): string | null {
  const targets = STATUS_TO_TO_STATUS[key];
  if (!targets) {
    return null;
  }
  const hit = [...events].reverse().find((e) => targets.includes(e.toStatus));
  return hit?.createdAt ?? null;
}

export function buildClientTimeline(
  status: BookingStatus,
  events: BookingTimelineEvent[] = [],
): ClientTimelineStep[] {
  const { doneThrough, currentIndex } = resolveTimelineProgress(status);

  return STEP_KEYS.map((key, index) => {
    let state: ClientTimelineStepState = 'upcoming';
    if (currentIndex === index) {
      state = 'current';
    } else if (index <= doneThrough) {
      state = 'done';
    }
    return {
      key,
      label: stepLabel(key, status),
      state,
      at: findEventAt(events, key),
    };
  });
}

/** UX C10 / RG-SEC-02 client view: full street after pro accept. */
export function canRevealFullAddress(status: BookingStatus): boolean {
  return (
    status === 'accepted' ||
    status === 'en_route' ||
    status === 'in_progress' ||
    status === 'completed' ||
    status === 'disputed'
  );
}

const CANCELABLE: BookingStatus[] = [
  'payment_authorized',
  'pending_provider',
  'accepted',
];

/** Soft UI rule: show cancel CTA when free window (RG-CANCEL > 24h). */
export function canShowCancelCta(status: BookingStatus, slotStartIso: string, now = new Date()): boolean {
  if (!CANCELABLE.includes(status)) {
    return false;
  }
  const slot = new Date(slotStartIso).getTime();
  if (Number.isNaN(slot)) {
    return false;
  }
  const hours = (slot - now.getTime()) / (1000 * 60 * 60);
  return hours > CANCEL_FREE_HOURS;
}

export function isTerminalUnassigned(status: BookingStatus): boolean {
  return status === 'unassigned' || status === 'expired';
}
