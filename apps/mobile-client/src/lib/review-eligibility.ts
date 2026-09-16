import type { ReviewTag } from '@carservice/shared-types';

/** Aligné REVIEW_WINDOW_HOURS (@carservice/shared-types / RG-QUAL-05). */
export const REVIEW_WINDOW_HOURS = 72;

export const REVIEW_TAG_OPTIONS: { value: ReviewTag; label: string }[] = [
  { value: 'punctuality', label: 'Ponctualité' },
  { value: 'quality', label: 'Qualité' },
  { value: 'cleanliness', label: 'Propreté' },
  { value: 'friendliness', label: 'Sympathie' },
];

/** Display-only: eligibility for C11 (status + 72h window). */
export function canLeaveReview(input: {
  status: string;
  completedAtIso: string | null;
  now?: Date;
}): boolean {
  if (input.status !== 'completed') {
    return false;
  }
  if (!input.completedAtIso) {
    return true;
  }
  const completedAt = new Date(input.completedAtIso).getTime();
  if (Number.isNaN(completedAt)) {
    return false;
  }
  const now = (input.now ?? new Date()).getTime();
  const hours = (now - completedAt) / (1000 * 60 * 60);
  return hours >= 0 && hours <= REVIEW_WINDOW_HOURS;
}

export function completedAtFromTimeline(
  timeline: { toStatus: string; createdAt: string }[],
): string | null {
  const hit = [...timeline].reverse().find((e) => e.toStatus === 'completed');
  return hit?.createdAt ?? null;
}
