import { api, ApiError } from '@carservice/api-client';
import type {
  AddressSnapshot,
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
export const MOCK_ADDRESS_COMPLEMENT = 'Bâtiment B, 2e étage';
export const MOCK_CLIENT_PHONE = '+33612345678';
export const MOCK_MISSION_LAT = 45.7606;
export const MOCK_MISSION_LNG = 4.8594;

export const DECLINE_REASONS = [
  { id: 'too_far', label: 'Trop loin de ma zone' },
  { id: 'slot', label: 'Créneau horaire indisponible' },
  { id: 'amount', label: 'Montant trop bas' },
  { id: 'other', label: 'Autre raison' },
] as const;
export type DeclineReasonId = (typeof DECLINE_REASONS)[number]['id'];

export const CANCEL_REASONS = [
  { id: 'unreachable', label: 'Client injoignable' },
  { id: 'personal', label: 'Empêchement personnel' },
  { id: 'vehicle', label: 'Problème de véhicule' },
] as const;
export type CancelReasonId = (typeof CANCEL_REASONS)[number]['id'];

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
  complement: string | null;
  offerHint: string;
  status: BookingStatus;
  lat: number | null;
  lng: number | null;
  clientPhone: string | null;
};

export type MissionBoard = {
  newMissions: MissionCardModel[];
  upcoming: MissionCardModel[];
  active: MissionCardModel[];
};

type MockAssigned = {
  booking: AvailableBooking;
  status: Extract<BookingStatus, 'accepted' | 'en_route' | 'in_progress'>;
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

let mockAssigned: MockAssigned[] = [];

export function resetMockMissions(): void {
  mockAvailable = MOCK_SEED.map((item) => ({
    ...item,
    zone: { ...item.zone },
  }));
  mockAssigned = [];
}

function cloneAvailable(booking: AvailableBooking): AvailableBooking {
  return { ...booking, zone: { ...booking.zone } };
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

function offerHint(offerName: string): string {
  return offerName === 'Complet'
    ? 'Extérieur + intérieur détaillé'
    : 'Formule plateforme';
}

function formatStreet(snapshot: AddressSnapshot): string {
  return `${snapshot.street}, ${snapshot.postalCode} ${snapshot.city}`;
}

function toDetail(
  booking: AvailableBooking,
  extras: {
    status: BookingStatus;
    street: string | null;
    complement: string | null;
    lat: number | null;
    lng: number | null;
    clientPhone: string | null;
    vehicleType?: string | null;
    inProgress?: boolean;
  },
): MissionDetailModel {
  return {
    ...toCardFromAvailable(booking),
    inProgress: extras.inProgress ?? extras.status === 'in_progress',
    vehicleLabel: vehicleLabel(extras.vehicleType ?? 'berline'),
    street: extras.street,
    complement: extras.complement,
    offerHint: offerHint(booking.offerName),
    status: extras.status,
    lat: extras.lat,
    lng: extras.lng,
    clientPhone: extras.clientPhone,
  };
}

function assignedExtras(status: MockAssigned['status']): {
  status: MockAssigned['status'];
  street: string;
  complement: string;
  lat: number;
  lng: number;
  clientPhone: string;
  inProgress: boolean;
} {
  return {
    status,
    street: MOCK_HIDDEN_STREET,
    complement: MOCK_ADDRESS_COMPLEMENT,
    lat: MOCK_MISSION_LAT,
    lng: MOCK_MISSION_LNG,
    clientPhone: MOCK_CLIENT_PHONE,
    inProgress: status === 'in_progress',
  };
}

function requireAssigned(bookingId: string): MockAssigned {
  const row = mockAssigned.find((item) => item.booking.id === bookingId);
  if (!row) {
    throw new ApiError('BOOKING_NOT_FOUND', 'Mission introuvable.', 404);
  }
  return row;
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

export function canConfirmCancel(reasonId: CancelReasonId | null): boolean {
  return reasonId !== null;
}

export function missionOpenHref(
  mission: MissionCardModel,
  tab: MissionTab,
): string {
  if (tab === 'new') {
    return `/missions/${mission.id}`;
  }
  if (mission.inProgress) {
    return `/missions/${mission.id}/execute`;
  }
  return `/missions/${mission.id}/active`;
}

export async function fetchMissionBoard(): Promise<MissionBoard> {
  if (useMocksNow()) {
    return {
      newMissions: mockAvailable.map(toCardFromAvailable),
      upcoming: mockAssigned
        .filter((item) => item.status === 'accepted')
        .map((item) => toCardFromAvailable(item.booking)),
      active: mockAssigned
        .filter(
          (item) => item.status === 'en_route' || item.status === 'in_progress',
        )
        .map((item) => ({
          ...toCardFromAvailable(item.booking),
          inProgress: item.status === 'in_progress',
        })),
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
    const assigned = mockAssigned.find((item) => item.booking.id === bookingId);
    if (assigned) {
      return toDetail(assigned.booking, assignedExtras(assigned.status));
    }
    const row = mockAvailable.find((item) => item.id === bookingId);
    if (!row) {
      throw new ApiError('BOOKING_NOT_FOUND', 'Mission introuvable.', 404);
    }
    return toDetail(row, {
      status: 'pending_provider',
      street: null,
      complement: null,
      lat: null,
      lng: null,
      clientPhone: null,
    });
  }

  bootstrapApiClient();
  const detail = await api.bookings.get(bookingId);
  const snapshot = detail.addressSnapshot;
  const reveal =
    detail.status !== 'pending_provider' && snapshot !== null;
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
    {
      status: detail.status,
      street: reveal && snapshot ? formatStreet(snapshot) : null,
      complement: reveal && snapshot ? snapshot.complement ?? snapshot.instructions : null,
      lat: reveal && snapshot ? snapshot.lat : null,
      lng: reveal && snapshot ? snapshot.lng : null,
      clientPhone: reveal ? detail.client?.phone ?? null : null,
      vehicleType: detail.vehicleType,
      inProgress: detail.status === 'in_progress',
    },
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
    mockAssigned = [
      ...mockAssigned,
      { booking: cloneAvailable(row), status: 'accepted' },
    ];
    return { street: MOCK_HIDDEN_STREET };
  }

  bootstrapApiClient();
  const accepted = await api.bookings.accept(bookingId);
  return {
    street: formatStreet(accepted.addressSnapshot),
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

/** PATCH en_route — transition validée par l’API, pas ici. */
export async function startEnRoute(
  bookingId: string,
): Promise<MissionDetailModel> {
  if (useMocksNow()) {
    const row = requireAssigned(bookingId);
    if (row.status !== 'accepted') {
      throw new ApiError(
        'BOOKING_INVALID_TRANSITION',
        'Cette étape n’est plus possible.',
        409,
      );
    }
    row.status = 'en_route';
    return toDetail(row.booking, assignedExtras(row.status));
  }

  bootstrapApiClient();
  await api.bookings.updateStatus(bookingId, { status: 'en_route' });
  return fetchMissionDetail(bookingId);
}

/** PATCH in_progress — lat/lng omis : géofence 200 m = API (RG-BOOK-03). */
export async function markArrived(
  bookingId: string,
): Promise<MissionDetailModel> {
  if (useMocksNow()) {
    const row = requireAssigned(bookingId);
    if (row.status !== 'en_route') {
      throw new ApiError(
        'BOOKING_INVALID_TRANSITION',
        'Cette étape n’est plus possible.',
        409,
      );
    }
    row.status = 'in_progress';
    return toDetail(row.booking, assignedExtras(row.status));
  }

  bootstrapApiClient();
  await api.bookings.updateStatus(bookingId, { status: 'in_progress' });
  return fetchMissionDetail(bookingId);
}

export async function cancelAssignedMission(
  bookingId: string,
  reason: string,
): Promise<void> {
  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    throw new ApiError(
      'BOOKING_CANCEL_REASON_REQUIRED',
      'Indiquez un motif d’annulation.',
      400,
    );
  }

  if (useMocksNow()) {
    const row = requireAssigned(bookingId);
    if (row.status === 'in_progress') {
      throw new ApiError(
        'BOOKING_CANCEL_VIA_DISPUTE',
        'La mission a déjà commencé. Contactez le support.',
        409,
      );
    }
    mockAssigned = mockAssigned.filter((item) => item.booking.id !== bookingId);
    return;
  }

  bootstrapApiClient();
  await api.bookings.cancel(bookingId, { reason: trimmed });
}
