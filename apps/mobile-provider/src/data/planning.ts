import { api } from '@carservice/api-client';
import type {
  ProviderAvailabilityResponse,
  UpdateProviderAvailabilityDto,
} from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import { TIME_CHIPS, WEEK_DAYS } from '../lib/kyc-validation';
import { bootstrapApiClient } from './api-bootstrap';
import { fetchMissionBoard, type MissionCardModel } from './missions';

export const PLANNING_CHIPS = [
  ...TIME_CHIPS,
  { startTime: '20:00', endTime: '22:00', label: '20h-22h' },
] as const;

export type PlanningChip = (typeof PLANNING_CHIPS)[number];

export type PlanningModel = {
  weeklySlots: ProviderAvailabilityResponse['weeklySlots'];
  upcoming: MissionCardModel[];
};

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

const MOCK_SLOT_ID = 'b1111111-1111-4111-8111-111111111301';

let mockSlots: ProviderAvailabilityResponse['weeklySlots'] = WEEK_DAYS.filter(
  (day) => day.key !== 0 && day.key !== 3,
).flatMap((day) =>
  TIME_CHIPS.slice(0, 3).map((chip, index) => ({
    id: `${MOCK_SLOT_ID.slice(0, -1)}${day.key}${index}`,
    dayOfWeek: day.key,
    startTime: chip.startTime,
    endTime: chip.endTime,
    isActive: true,
  })),
);

export function resetMockPlanning(): void {
  mockSlots = WEEK_DAYS.filter((day) => day.key !== 0 && day.key !== 3).flatMap(
    (day) =>
      TIME_CHIPS.slice(0, 3).map((chip, index) => ({
        id: `${MOCK_SLOT_ID.slice(0, -1)}${day.key}${index}`,
        dayOfWeek: day.key,
        startTime: chip.startTime,
        endTime: chip.endTime,
        isActive: true,
      })),
  );
}

export function weekDates(now = new Date()): Array<{
  dayOfWeek: number;
  label: string;
  date: number;
  available: boolean;
}> {
  const monday = new Date(now);
  const jsDay = monday.getDay();
  const offset = jsDay === 0 ? -6 : 1 - jsDay;
  monday.setDate(monday.getDate() + offset);
  monday.setHours(12, 0, 0, 0);
  return WEEK_DAYS.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      dayOfWeek: day.key,
      label: day.label,
      date: date.getDate(),
      available: false,
    };
  });
}

export function chipActive(
  slots: PlanningModel['weeklySlots'],
  dayOfWeek: number,
  chip: PlanningChip,
): boolean {
  return slots.some(
    (slot) =>
      slot.dayOfWeek === dayOfWeek &&
      slot.startTime === chip.startTime &&
      slot.endTime === chip.endTime &&
      slot.isActive,
  );
}

export function slotsForDay(
  slots: PlanningModel['weeklySlots'],
  dayOfWeek: number,
): PlanningModel['weeklySlots'] {
  return slots.filter((slot) => slot.dayOfWeek === dayOfWeek && slot.isActive);
}

function toUpdateDto(
  slots: PlanningModel['weeklySlots'],
): UpdateProviderAvailabilityDto {
  return {
    weeklySlots: slots.map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: slot.isActive,
    })),
    blockedSlots: [],
  };
}

export async function fetchPlanning(): Promise<PlanningModel> {
  if (useMocksNow()) {
    const board = await fetchMissionBoard();
    return { weeklySlots: mockSlots, upcoming: board.upcoming };
  }
  bootstrapApiClient();
  const [availability, board] = await Promise.all([
    api.providers.availability(),
    fetchMissionBoard(),
  ]);
  return { weeklySlots: availability.weeklySlots, upcoming: board.upcoming };
}

export async function togglePlanningChip(
  current: PlanningModel,
  dayOfWeek: number,
  chip: PlanningChip,
): Promise<PlanningModel> {
  const exists = chipActive(current.weeklySlots, dayOfWeek, chip);
  let weeklySlots = current.weeklySlots;
  if (exists) {
    weeklySlots = weeklySlots.filter(
      (slot) =>
        !(
          slot.dayOfWeek === dayOfWeek &&
          slot.startTime === chip.startTime &&
          slot.endTime === chip.endTime
        ),
    );
  } else {
    weeklySlots = [
      ...weeklySlots,
      {
        id: `00000000-0000-4000-8000-00000000000${dayOfWeek}`,
        dayOfWeek,
        startTime: chip.startTime,
        endTime: chip.endTime,
        isActive: true,
      },
    ];
  }
  if (weeklySlots.filter((slot) => slot.isActive).length === 0) {
    return current;
  }
  if (useMocksNow()) {
    mockSlots = weeklySlots;
    return { ...current, weeklySlots };
  }
  bootstrapApiClient();
  const saved = await api.providers.updateAvailability(toUpdateDto(weeklySlots));
  return { ...current, weeklySlots: saved.weeklySlots };
}
