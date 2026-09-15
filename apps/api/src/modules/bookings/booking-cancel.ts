import {
  CANCEL_FEE_LATE_PERCENT,
  CANCEL_FEE_MID_PERCENT,
  CANCEL_FREE_HOURS,
  CANCEL_LATE_HOURS,
  CANCEL_PROVIDER_PENALTY_LATE,
  CANCEL_PROVIDER_PENALTY_MID,
  type CancelWindow,
} from '@carservice/shared-types';

export function hoursUntilSlot(slotStart: Date, now: Date): number {
  return (slotStart.getTime() - now.getTime()) / (60 * 60 * 1000);
}

export function resolveCancelWindow(
  hours: number,
  freeHours = CANCEL_FREE_HOURS,
  lateHours = CANCEL_LATE_HOURS,
): CancelWindow {
  if (hours > freeHours) {
    return 'free';
  }
  if (hours >= lateHours) {
    return 'mid';
  }
  return 'late';
}

export function clientCancelFeeCents(
  totalCents: number,
  window: CancelWindow,
  midPercent = CANCEL_FEE_MID_PERCENT,
  latePercent = CANCEL_FEE_LATE_PERCENT,
): number {
  const percent =
    window === 'free' ? 0 : window === 'mid' ? midPercent : latePercent;
  return Math.round((totalCents * percent) / 100);
}

export function providerCancelPenalty(window: CancelWindow): number {
  if (window === 'mid') {
    return CANCEL_PROVIDER_PENALTY_MID;
  }
  if (window === 'late') {
    return CANCEL_PROVIDER_PENALTY_LATE;
  }
  return 0;
}
