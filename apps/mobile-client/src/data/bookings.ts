import { api } from '@carservice/api-client';
import { env, parseUseMocks } from '../config/env';
import bookingsMock from '../mocks/bookings.json';
import { bootstrapApiClient } from './api-bootstrap';
import type { HomeBookingSummary } from './home-types';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

export async function listUpcomingBookings(): Promise<HomeBookingSummary[]> {
  if (useMocksNow()) {
    return bookingsMock.upcoming.map((b) => ({
      id: b.id,
      reference: b.reference,
      status: b.status,
      offerName: b.offerName,
      scheduledAt: b.scheduledAt,
      totalCents: b.totalCents,
    }));
  }

  bootstrapApiClient();
  const list = await api.bookings.list({ group: 'upcoming' });
  return list.map((b) => ({
    id: b.id,
    reference: b.reference,
    status: b.status,
    offerName: b.offerName,
    scheduledAt: b.slotStart,
    totalCents: b.totalCents,
  }));
}

export async function listPastBookings(): Promise<HomeBookingSummary[]> {
  if (useMocksNow()) {
    const past = bookingsMock.past as HomeBookingSummary[];
    return past.map((b) => ({
      id: b.id,
      reference: b.reference,
      status: b.status,
      offerName: b.offerName,
      scheduledAt: b.scheduledAt,
      totalCents: b.totalCents,
    }));
  }

  bootstrapApiClient();
  const list = await api.bookings.list({ group: 'past' });
  return list.map((b) => ({
    id: b.id,
    reference: b.reference,
    status: b.status,
    offerName: b.offerName,
    scheduledAt: b.slotStart,
    totalCents: b.totalCents,
  }));
}
