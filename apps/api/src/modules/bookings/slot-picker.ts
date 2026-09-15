import {
  SLOT_PICKER_HORIZON_DAYS,
  SLOT_PICKER_INTERVAL_MINUTES,
  SLOT_PICKER_WINDOW_END_MINUTES,
  SLOT_PICKER_WINDOW_START_MINUTES,
} from '@carservice/shared-types';
import { providerCanTakeSlot } from './matching-rules';
import type { CapacityCandidate } from './booking-matching.service';

export type GeneratedSlot = {
  start: Date;
  end: Date;
};

export type SlotPickerDayDraft = {
  date: string;
  slots: GeneratedSlot[];
};

export function utcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildSlotGrid(input: {
  now: Date;
  durationMinutes: number;
  leadHours: number;
  horizonDays?: number;
  intervalMinutes?: number;
  windowStartMinutes?: number;
  windowEndMinutes?: number;
}): SlotPickerDayDraft[] {
  const horizonDays = input.horizonDays ?? SLOT_PICKER_HORIZON_DAYS;
  const interval = input.intervalMinutes ?? SLOT_PICKER_INTERVAL_MINUTES;
  const windowStart =
    input.windowStartMinutes ?? SLOT_PICKER_WINDOW_START_MINUTES;
  const windowEnd = input.windowEndMinutes ?? SLOT_PICKER_WINDOW_END_MINUTES;
  const minStart = new Date(
    input.now.getTime() + input.leadHours * 60 * 60 * 1000,
  );
  const origin = utcDayStart(input.now);
  const days: SlotPickerDayDraft[] = [];

  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const day = new Date(origin.getTime() + offset * 24 * 60 * 60 * 1000);
    const slots: GeneratedSlot[] = [];

    for (let startMin = windowStart; startMin < windowEnd; startMin += interval) {
      const start = new Date(day.getTime() + startMin * 60 * 1000);
      const end = new Date(start.getTime() + input.durationMinutes * 60 * 1000);
      if (start.getTime() < minStart.getTime()) {
        continue;
      }
      slots.push({ start, end });
    }

    days.push({ date: formatUtcDate(day), slots });
  }

  return days;
}

export function slotHasCapacity(
  slot: GeneratedSlot,
  pool: CapacityCandidate[],
): boolean {
  return pool.some((candidate) =>
    providerCanTakeSlot({
      slotStart: slot.start,
      slotEnd: slot.end,
      availability: candidate.availability,
      blockedSlots: candidate.blockedSlots,
      busyRanges: candidate.busyRanges,
      distanceKm: candidate.distanceKm,
      radiusKm: candidate.radiusKm,
    }),
  );
}
