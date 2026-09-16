import {
  buildMockCreateBookingResponse,
  createBooking,
} from '../checkout';

describe('checkout mock', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  const pricing = {
    base: 3900,
    vehicleSurcharge: 0,
    options: [],
    serviceFee: 200,
    totalCents: 4100,
    currency: 'EUR' as const,
  };

  it('buildMockCreateBookingResponse expose PI mock et référence valide', () => {
    const res = buildMockCreateBookingResponse({
      offerId: 'a1111111-1111-4111-8111-111111111102',
      vehicleType: 'citadine',
      optionIds: [],
      addressId: 'c1111111-1111-4111-8111-111111111301',
      slotStart: '2026-09-20T09:00:00.000Z',
      slotEnd: '2026-09-20T10:15:00.000Z',
      totalCents: 4100,
      pricing,
      durationMinutes: 75,
    });
    expect(res.booking.reference).toMatch(/^CS-\d{8}-[A-Z0-9]{4}$/);
    expect(res.payment.clientSecret).toContain('pi_mock');
    expect(res.booking.status).toBe('pending_provider');
  });

  it('createBooking mock réussit', async () => {
    const res = await createBooking(
      {
        offerId: 'a1111111-1111-4111-8111-111111111102',
        vehicleType: 'citadine',
        optionIds: [],
        addressId: 'c1111111-1111-4111-8111-111111111301',
        slotStart: '2026-09-20T09:00:00.000Z',
      },
      { pricing, slotEnd: '2026-09-20T10:15:00.000Z', durationMinutes: 75 },
    );
    expect(res.booking.id).toBeTruthy();
  });
});
