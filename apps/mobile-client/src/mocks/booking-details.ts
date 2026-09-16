import type { BookingDetail, BookingStatus } from '@carservice/shared-types';

/** Same id as mock checkout create — CS-M11-S05 */
export const MOCK_BOOKING_ID = 'e1111111-1111-4111-8111-111111111501';
export const MOCK_BOOKING_ACCEPTED_ID = 'e1111111-1111-4111-8111-111111111502';
export const MOCK_BOOKING_UNASSIGNED_ID = 'e1111111-1111-4111-8111-111111111503';

const BASE_PRICING = {
  base: 3900,
  vehicleSurcharge: 0,
  options: [] as { id: string; name: string; amount: number }[],
  serviceFee: 0,
  totalCents: 3900,
  currency: 'EUR' as const,
};

function buildDetail(input: {
  id: string;
  reference: string;
  status: BookingStatus;
  withProvider: boolean;
  withFullAddress: boolean;
}): BookingDetail {
  const slotStart = '2026-09-20T09:00:00.000Z';
  const slotEnd = '2026-09-20T10:15:00.000Z';
  const created = '2026-09-16T18:00:00.000Z';

  const timeline: BookingDetail['timeline'] = [
    {
      fromStatus: null,
      toStatus: 'payment_authorized',
      actorType: 'system',
      reason: null,
      createdAt: created,
    },
    {
      fromStatus: 'payment_authorized',
      toStatus: 'pending_provider',
      actorType: 'system',
      reason: null,
      createdAt: '2026-09-16T18:00:05.000Z',
    },
  ];

  if (input.status === 'accepted' || input.status === 'en_route' || input.status === 'in_progress' || input.status === 'completed') {
    timeline.push({
      fromStatus: 'pending_provider',
      toStatus: 'accepted',
      actorType: 'provider',
      reason: null,
      createdAt: '2026-09-16T18:12:00.000Z',
    });
  }
  if (input.status === 'en_route' || input.status === 'in_progress' || input.status === 'completed') {
    timeline.push({
      fromStatus: 'accepted',
      toStatus: 'en_route',
      actorType: 'provider',
      reason: null,
      createdAt: '2026-09-20T08:45:00.000Z',
    });
  }
  if (input.status === 'in_progress' || input.status === 'completed') {
    timeline.push({
      fromStatus: 'en_route',
      toStatus: 'in_progress',
      actorType: 'provider',
      reason: null,
      createdAt: '2026-09-20T09:05:00.000Z',
    });
  }
  if (input.status === 'completed') {
    timeline.push({
      fromStatus: 'in_progress',
      toStatus: 'completed',
      actorType: 'provider',
      reason: null,
      createdAt: '2026-09-20T10:10:00.000Z',
    });
  }
  if (input.status === 'unassigned') {
    timeline.push({
      fromStatus: 'pending_provider',
      toStatus: 'unassigned',
      actorType: 'system',
      reason: 'matching_timeout',
      createdAt: '2026-09-16T20:00:00.000Z',
    });
  }

  return {
    id: input.id,
    reference: input.reference,
    status: input.status,
    slotStart,
    slotEnd,
    offerName: 'Confort',
    vehicleType: 'citadine',
    totalCents: 3900,
    currency: 'EUR',
    zone: { slug: 'lyon', name: 'Lyon' },
    addressSnapshot: input.withFullAddress
      ? {
          street: '12 rue de la République',
          complement: null,
          city: 'Lyon',
          postalCode: '69001',
          country: 'FR',
          lat: 45.764,
          lng: 4.8357,
          instructions: null,
          label: null,
        }
      : {
          street: 'Adresse masquée',
          complement: null,
          city: 'Lyon',
          postalCode: '69001',
          country: 'FR',
          lat: 45.764,
          lng: 4.8357,
          instructions: null,
          label: null,
        },
    clientComment: null,
    providerNotes: null,
    pricingSnapshot: BASE_PRICING,
    timeline,
    photos: [],
    provider: input.withProvider
      ? {
          companyName: 'Marc Wash',
          avatarUrl: null,
          ratingAvg: 4.8,
          washMethods: ['waterless'],
        }
      : null,
    client: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
    },
  };
}

const DETAILS: Record<string, BookingDetail> = {
  [MOCK_BOOKING_ID]: buildDetail({
    id: MOCK_BOOKING_ID,
    reference: 'CS-20260920-DEMO',
    status: 'pending_provider',
    withProvider: false,
    withFullAddress: false,
  }),
  [MOCK_BOOKING_ACCEPTED_ID]: buildDetail({
    id: MOCK_BOOKING_ACCEPTED_ID,
    reference: 'CS-20260920-ACCP',
    status: 'accepted',
    withProvider: true,
    withFullAddress: true,
  }),
  [MOCK_BOOKING_UNASSIGNED_ID]: buildDetail({
    id: MOCK_BOOKING_UNASSIGNED_ID,
    reference: 'CS-20260920-NONE',
    status: 'unassigned',
    withProvider: false,
    withFullAddress: false,
  }),
};

export function getMockBookingDetail(bookingId: string): BookingDetail | null {
  return DETAILS[bookingId] ?? null;
}

export function listMockBookingDetails(): BookingDetail[] {
  return Object.values(DETAILS);
}
