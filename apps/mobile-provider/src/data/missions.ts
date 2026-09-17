import { api } from '@carservice/api-client';
import type {
  AvailableBooking,
  BookingListItem,
  BookingStatus,
} from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import {
  formatDurationLabel,
  formatNetEur,
  formatSlotLabel,
  quartierLabel,
} from '../lib/mission-format';
import { bootstrapApiClient } from './api-bootstrap';

export type MissionTab = 'new' | 'upcoming' | 'active';

export type MissionCardModel = {
  id: string;
  offerName: string;
  quartier: string;
  netLabel: string;
  slotLabel: string;
  durationLabel: string;
  inProgress: boolean;
};

export type MissionBoard = {
  newMissions: MissionCardModel[];
  upcoming: MissionCardModel[];
  active: MissionCardModel[];
};

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

function hoursFromNow(hours: number): { start: string; end: string } {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + hours);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

const SLOT_A = hoursFromNow(2);
const SLOT_B = hoursFromNow(4);

const MOCK_NEW: AvailableBooking[] = [
  {
    id: 'a1111111-1111-4111-8111-111111111101',
    reference: 'CS-20260917-A7B2',
    slotStart: SLOT_A.start,
    slotEnd: SLOT_A.end,
    offerName: 'Complet',
    totalCents: 9700,
    currency: 'EUR',
    score: 72.5,
    zone: { slug: 'lyon-3', name: 'Lyon 3e — Part-Dieu' },
  },
  {
    id: 'a1111111-1111-4111-8111-111111111102',
    reference: 'CS-20260917-B3C1',
    slotStart: SLOT_B.start,
    slotEnd: SLOT_B.end,
    offerName: 'Extérieur',
    totalCents: 4000,
    currency: 'EUR',
    score: 61,
    zone: { slug: 'lyon-6', name: 'Lyon 6e — Foch' },
  },
];

function toCardFromAvailable(booking: AvailableBooking): MissionCardModel {
  return {
    id: booking.id,
    offerName: booking.offerName,
    quartier: quartierLabel(booking.zone.name),
    netLabel: formatNetEur(booking.totalCents),
    slotLabel: formatSlotLabel(booking.slotStart),
    durationLabel: formatDurationLabel(booking.slotStart, booking.slotEnd),
    inProgress: false,
  };
}

function toCardFromAssigned(booking: BookingListItem): MissionCardModel {
  return {
    id: booking.id,
    offerName: booking.offerName,
    quartier: quartierLabel(booking.zone.name),
    netLabel: formatNetEur(booking.totalCents),
    slotLabel: formatSlotLabel(booking.slotStart),
    durationLabel: formatDurationLabel(booking.slotStart, booking.slotEnd),
    inProgress: booking.status === 'in_progress',
  };
}

export function missionsForTab(
  board: MissionBoard,
  tab: MissionTab,
): MissionCardModel[] {
  if (tab === 'upcoming') {
    return board.upcoming;
  }
  if (tab === 'active') {
    return board.active;
  }
  return board.newMissions;
}

export async function fetchMissionBoard(): Promise<MissionBoard> {
  if (useMocksNow()) {
    return {
      newMissions: MOCK_NEW.map(toCardFromAvailable),
      upcoming: [],
      active: [],
    };
  }

  bootstrapApiClient();
  const [available, upcoming, active] = await Promise.all([
    api.bookings.available(),
    api.bookings.list({ status: ['accepted'] }),
    api.bookings.list({
      status: ['en_route', 'in_progress'] as BookingStatus[],
    }),
  ]);

  return {
    newMissions: available.map(toCardFromAvailable),
    upcoming: upcoming.map(toCardFromAssigned),
    active: active.map(toCardFromAssigned),
  };
}
