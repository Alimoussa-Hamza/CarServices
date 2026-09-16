import { getBookingDetail } from '../bookings';
import {
  MOCK_BOOKING_ACCEPTED_ID,
  MOCK_BOOKING_ID,
} from '../../mocks/booking-details';

describe('getBookingDetail (mock)', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  it('retourne détail pending_provider + timeline', async () => {
    const detail = await getBookingDetail(MOCK_BOOKING_ID);
    expect(detail.status).toBe('pending_provider');
    expect(detail.timeline.length).toBeGreaterThan(0);
    expect(detail.provider).toBeNull();
  });

  it('retourne détail accepted avec provider', async () => {
    const detail = await getBookingDetail(MOCK_BOOKING_ACCEPTED_ID);
    expect(detail.status).toBe('accepted');
    expect(detail.provider?.companyName).toBe('Marc Wash');
  });

  it('404 si id inconnu', async () => {
    await expect(
      getBookingDetail('e1111111-1111-4111-8111-111111111599'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
