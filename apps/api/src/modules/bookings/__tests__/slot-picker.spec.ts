import {
  SLOT_PICKER_HORIZON_DAYS,
  SLOT_PICKER_INTERVAL_MINUTES,
} from '@carservice/shared-types';
import { providerCanTakeSlot } from '../matching-rules';
import { buildSlotGrid, slotHasCapacity } from '../slot-picker';

describe('buildSlotGrid', () => {
  it('masque les créneaux avant le délai min (C07 J+0)', () => {
    const now = new Date('2026-09-15T10:30:00.000Z');
    const days = buildSlotGrid({
      now,
      durationMinutes: 90,
      leadHours: 2,
    });

    expect(days).toHaveLength(SLOT_PICKER_HORIZON_DAYS + 1);
    expect(days[0]?.date).toBe('2026-09-15');
    expect(days[days.length - 1]?.date).toBe('2026-09-29');
    expect(
      days[0]?.slots.every(
        (slot) => slot.start.getTime() >= now.getTime() + 2 * 60 * 60 * 1000,
      ),
    ).toBe(true);
    expect(days[0]?.slots[0]?.start.toISOString()).toBe(
      '2026-09-15T13:00:00.000Z',
    );
    expect(
      days[0]?.slots[0]?.end.getTime() - (days[0]?.slots[0]?.start.getTime() ?? 0),
    ).toBe(90 * 60 * 1000);
  });

  it('génère une grille 1 h entre 08:00 et 20:00 UTC', () => {
    const days = buildSlotGrid({
      now: new Date('2026-09-20T00:00:00.000Z'),
      durationMinutes: 60,
      leadHours: 0,
    });
    const starts = days[0]?.slots.map((slot) => slot.start.getUTCHours()) ?? [];

    expect(starts[0]).toBe(8);
    expect(starts[starts.length - 1]).toBe(19);
    expect(starts.length).toBe(
      (20 * 60 - 8 * 60) / SLOT_PICKER_INTERVAL_MINUTES,
    );
  });
});

describe('slotHasCapacity', () => {
  const weekly = [
    {
      dayOfWeek: 2,
      startTime: new Date('1970-01-01T08:00:00.000Z'),
      endTime: new Date('1970-01-01T18:00:00.000Z'),
      isActive: true,
    },
  ];
  const slot = {
    start: new Date('2026-09-15T14:00:00.000Z'),
    end: new Date('2026-09-15T15:30:00.000Z'),
  };

  it('est disponible s’il reste un pro éligible', () => {
    expect(
      slotHasCapacity(slot, [
        {
          availability: weekly,
          blockedSlots: [],
          busyRanges: [],
          distanceKm: 3,
          radiusKm: 20,
        },
      ]),
    ).toBe(true);
  });

  it('est complet si le pro est déjà occupé', () => {
    expect(
      slotHasCapacity(slot, [
        {
          availability: weekly,
          blockedSlots: [],
          busyRanges: [
            {
              start: new Date('2026-09-15T14:30:00.000Z'),
              end: new Date('2026-09-15T16:00:00.000Z'),
            },
          ],
          distanceKm: 3,
          radiusKm: 20,
        },
      ]),
    ).toBe(false);
  });
});

describe('providerCanTakeSlot', () => {
  const weekly = [
    {
      dayOfWeek: 2,
      startTime: new Date('1970-01-01T08:00:00.000Z'),
      endTime: new Date('1970-01-01T18:00:00.000Z'),
      isActive: true,
    },
  ];

  it('refuse un rayon trop court', () => {
    expect(
      providerCanTakeSlot({
        slotStart: new Date('2026-09-15T14:00:00.000Z'),
        slotEnd: new Date('2026-09-15T15:30:00.000Z'),
        availability: weekly,
        blockedSlots: [],
        busyRanges: [],
        distanceKm: 12,
        radiusKm: 5,
      }),
    ).toBe(false);
  });
});
