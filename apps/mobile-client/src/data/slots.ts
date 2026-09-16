import { api } from '@carservice/api-client';
import type { SlotPickerRequest, SlotPickerResponse } from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import { bootstrapApiClient } from './api-bootstrap';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Generate a short mock grid (3 days) for offline booking UX. */
export function buildMockSlots(durationMinutes = 75): SlotPickerResponse {
  const days: SlotPickerResponse['days'] = [];
  const now = new Date();

  for (let d = 1; d <= 3; d += 1) {
    const day = new Date(now);
    day.setUTCDate(day.getUTCDate() + d);
    const y = day.getUTCFullYear();
    const m = pad(day.getUTCMonth() + 1);
    const dd = pad(day.getUTCDate());
    const date = `${y}-${m}-${dd}`;
    const slots = [9, 11, 14, 16].map((hour, index) => {
      const start = new Date(`${date}T${pad(hour)}:00:00.000Z`);
      const end = new Date(start.getTime() + durationMinutes * 60_000);
      return {
        start: start.toISOString(),
        end: end.toISOString(),
        available: index !== 1,
      };
    });
    days.push({ date, slots });
  }

  return {
    durationMinutes,
    minBookingLeadHours: 2,
    horizonDays: 14,
    zone: { slug: 'lyon', name: 'Lyon' },
    days,
  };
}

export async function fetchSlots(dto: SlotPickerRequest): Promise<SlotPickerResponse> {
  if (useMocksNow()) {
    return buildMockSlots();
  }

  bootstrapApiClient();
  return api.bookings.slots(dto);
}
