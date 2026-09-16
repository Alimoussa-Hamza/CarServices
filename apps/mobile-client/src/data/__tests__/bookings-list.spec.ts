import {
  listBookingsByGroup,
  listCancelledBookings,
  listPastBookings,
  listUpcomingBookings,
} from '../bookings';

describe('listBookingsByGroup (mock)', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  it('segmente upcoming / past / cancelled', async () => {
    const [upcoming, past, cancelled] = await Promise.all([
      listUpcomingBookings(),
      listPastBookings(),
      listCancelledBookings(),
    ]);
    expect(upcoming.length).toBeGreaterThanOrEqual(1);
    expect(past.some((b) => b.status === 'completed')).toBe(true);
    expect(cancelled.length).toBeGreaterThanOrEqual(1);
    expect(cancelled.some((b) => b.status === 'unassigned' || b.status.startsWith('cancelled'))).toBe(
      true,
    );
  });

  it('listBookingsByGroup accepte cancelled', async () => {
    const list = await listBookingsByGroup('cancelled');
    expect(list[0]?.reference).toMatch(/^CS-\d{8}-/);
  });
});
