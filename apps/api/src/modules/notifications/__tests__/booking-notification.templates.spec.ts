import {
  BOOKING_NOTIFICATION_TEMPLATES,
  renderBookingEmail,
  renderBookingSms,
} from '../booking-notification.templates';

describe('booking notification templates', () => {
  it('couvre les templates booking du guide intégrations', () => {
    expect(Object.keys(BOOKING_NOTIFICATION_TEMPLATES).sort()).toEqual([
      'booking_completed',
      'booking_confirmed',
      'provider_assigned',
      'provider_new_mission',
    ]);
  });

  it('rend booking_confirmed en email uniquement', () => {
    expect(renderBookingSms('booking_confirmed', { reference: 'CS-1' })).toBeNull();
    expect(
      renderBookingEmail('booking_confirmed', {
        reference: 'CS-20260915-ABCD',
        slotLabel: 'lun. 10:00',
      }),
    ).toMatchObject({
      subject: 'Réservation confirmée CS-20260915-ABCD',
    });
  });

  it('rend provider_new_mission en SMS', () => {
    expect(
      renderBookingSms('provider_new_mission', {
        reference: 'CS-20260915-ABCD',
        slotLabel: '10:00',
      }),
    ).toContain('nouvelle mission CS-20260915-ABCD');
  });
});
