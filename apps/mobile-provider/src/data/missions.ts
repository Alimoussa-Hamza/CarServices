import { api, ApiError } from '@carservice/api-client';
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

export const MOCK_MISSION_OK_ID = 'a1111111-1111-4111-8111-111111111101';
export const MOCK_MISSION_TAKEN_ID = 'a1111111-1111-4111-8111-111111111102';
export const MOCK_HIDDEN_STREET = '12 rue de la République, 69002 Lyon';

export const DECLINE_REASONS = [
  { id: 'too_far', label: 'Trop loin de ma zone' },
  { id: 'slot', label: 'Créneau horaire indisponible' },
  { id: 'amount', label: 'Montant trop bas' },
  { id: 'other', label: 'Autre raison' },
] as const;
export type DeclineReasonId = (typeof DECLINE_REASONS)[number]['id'];

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

export type MissionDetailModel = MissionCardModel & {
  vehicleLabel: string;
  street: string | null;
  offerHint: string;
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

const MOCK_SEED: AvailableBooking[] = [
  {
    id: MOCK_MISSION_OK_ID,
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
    id: MOCK_MISSION_TAKEN_ID,
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

let mockAvailable: AvailableBooking[] = MOCK_SEED.map((item) => ({
  ...item,
  zone: { ...item.zone },
}));

export function resetMockMissions(): void {
  mockAvailable = MOCK_SEED.map((item) => ({
    ...item,
    zone: { ...item.zone },
  }));
}

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

function toDetail(
  booking: AvailableBooking,
  street: string | null,
  vehicleType?: string | null,
): MissionDetailModel {
  return {
    ...toCardFromAvailable(booking),
    vehicleLabel: vehicleLabel(vehicleType ?? 'berline'),
    street,
    offerHint:
      booking.offerName === 'Complet'
        ? 'Extérieur + intérieur détaillé'
        : 'Formule plateforme',
  };
}

function vehicleLabel(type: string): string {
  if (type === 'suv') {
    return 'SUV';
  }
  if (type === 'utilitaire') {
    return 'Utilitaire';
  }
  if (type === 'citadine') {
    return 'Citadine';
  }
  if (type === 'moto') {
    return 'Moto';
  }
  return 'Berline';
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

export function canConfirmDecline(reasonId: DeclineReasonId | null): boolean {
  return reasonId !== null;
}

export async function fetchMissionBoard(): Promise<MissionBoard> {
  if (useMocksNow()) {
    return {
      newMissions: mockAvailable.map(toCardFromAvailable),
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

export async function fetchMissionDetail(
  bookingId: string,
): Promise<MissionDetailModel> {
  if (useMocksNow()) {
    const row = mockAvailable.find((item) => item.id === bookingId);
    if (!row) {
      throw new ApiError('BOOKING_NOT_FOUND', 'Mission introuvable.', 404);
    }
    return toDetail(row, null);
  }

  bootstrapApiClient();
  const detail = await api.bookings.get(bookingId);
  const street =
    detail.status !== 'pending_provider' && detail.addressSnapshot
      ? `${detail.addressSnapshot.street}, ${detail.addressSnapshot.postalCode} ${detail.addressSnapshot.city}`
      : null;
  return toDetail(
    {
      id: detail.id,
      reference: detail.reference,
      slotStart: detail.slotStart,
      slotEnd: detail.slotEnd,
      offerName: detail.offerName,
      totalCents: detail.totalCents,
      currency: 'EUR',
      score: 0,
      zone: detail.zone,
    },
    street,
    detail.vehicleType,
  );
}

export async function acceptMission(bookingId: string): Promise<{
  street: string;
}> {
  if (useMocksNow()) {
    if (bookingId === MOCK_MISSION_TAKEN_ID) {
      throw new ApiError(
        'BOOKING_ALREADY_ACCEPTED',
        "Cette mission n'est plus disponible.",
        409,
      );
    }
    const row = mockAvailable.find((item) => item.id === bookingId);
    if (!row) {
      throw new ApiError('BOOKING_NOT_FOUND', 'Mission introuvable.', 404);
    }
    mockAvailable = mockAvailable.filter((item) => item.id !== bookingId);
    return { street: MOCK_HIDDEN_STREET };
  }

  bootstrapApiClient();
  const accepted = await api.bookings.accept(bookingId);
  return {
    street: `${accepted.addressSnapshot.street}, ${accepted.addressSnapshot.postalCode} ${accepted.addressSnapshot.city}`,
  };
}

export async function declineMission(
  bookingId: string,
  reason: string,
): Promise<void> {
  if (useMocksNow()) {
    mockAvailable = mockAvailable.filter((item) => item.id !== bookingId);
    return;
  }

  bootstrapApiClient();
  await api.bookings.decline(bookingId, { reason });
}
