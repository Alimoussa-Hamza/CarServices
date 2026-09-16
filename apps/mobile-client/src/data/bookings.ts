import { api, ApiError } from '@carservice/api-client';
import type { BookingDetail, BookingListGroup } from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import bookingsMock from '../mocks/bookings.json';
import { getMockBookingDetail } from '../mocks/booking-details';
import { bootstrapApiClient } from './api-bootstrap';
import type { HomeBookingSummary } from './home-types';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

type MockListItem = {
  id: string;
  reference: string;
  status: string;
  offerName: string;
  scheduledAt: string;
  totalCents: number;
};

function mapMockItems(items: MockListItem[]): HomeBookingSummary[] {
  return items.map((b) => ({
    id: b.id,
    reference: b.reference,
    status: b.status,
    offerName: b.offerName,
    scheduledAt: b.scheduledAt,
    totalCents: b.totalCents,
  }));
}

function mockGroup(group: BookingListGroup): MockListItem[] {
  if (group === 'upcoming') {
    return bookingsMock.upcoming as MockListItem[];
  }
  if (group === 'past') {
    return bookingsMock.past as MockListItem[];
  }
  return (bookingsMock.cancelled ?? []) as MockListItem[];
}

export async function getBookingDetail(bookingId: string): Promise<BookingDetail> {
  if (useMocksNow()) {
    const mock = getMockBookingDetail(bookingId);
    if (!mock) {
      throw new ApiError('NOT_FOUND', 'Réservation introuvable.', 404);
    }
    return mock;
  }

  bootstrapApiClient();
  return api.bookings.get(bookingId);
}

/** C12 — list by API group `upcoming` | `past` | `cancelled`. */
export async function listBookingsByGroup(
  group: BookingListGroup,
): Promise<HomeBookingSummary[]> {
  if (useMocksNow()) {
    return mapMockItems(mockGroup(group));
  }

  bootstrapApiClient();
  const list = await api.bookings.list({ group });
  return list.map((b) => ({
    id: b.id,
    reference: b.reference,
    status: b.status,
    offerName: b.offerName,
    scheduledAt: b.slotStart,
    totalCents: b.totalCents,
  }));
}

export async function listUpcomingBookings(): Promise<HomeBookingSummary[]> {
  return listBookingsByGroup('upcoming');
}

export async function listPastBookings(): Promise<HomeBookingSummary[]> {
  return listBookingsByGroup('past');
}

export async function listCancelledBookings(): Promise<HomeBookingSummary[]> {
  return listBookingsByGroup('cancelled');
}
