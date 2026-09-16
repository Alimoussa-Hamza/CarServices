import { listHomeOffers } from '../catalog';
import { listUpcomingBookings } from '../bookings';

describe('home data (mock)', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  it('liste les formules mock', async () => {
    const offers = await listHomeOffers();
    expect(offers.length).toBeGreaterThanOrEqual(3);
    expect(offers[0]?.priceCents).toBeGreaterThan(0);
  });

  it('liste une réservation upcoming mock', async () => {
    const upcoming = await listUpcomingBookings();
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]?.reference).toBe('CS-DEMO-001');
  });
});
