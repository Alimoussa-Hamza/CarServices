import { formatBookingStatus } from '../booking-status';

describe('formatBookingStatus', () => {
  it('mappe pending_provider', () => {
    expect(formatBookingStatus('pending_provider')).toContain('professionnel');
  });

  it('fallback sur le code brut', () => {
    expect(formatBookingStatus('custom_status')).toBe('custom_status');
  });
});
