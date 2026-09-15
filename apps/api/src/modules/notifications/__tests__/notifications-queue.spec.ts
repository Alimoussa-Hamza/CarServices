import {
  notificationsEmailJobId,
  notificationsPushJobId,
  notificationsSmsJobId,
} from '../notifications-queue.service';

describe('notifications job ids', () => {
  it('évite les « : » interdits par BullMQ 6', () => {
    expect(
      notificationsPushJobId('11111111-1111-4111-8111-111111111111', 'a:b'),
    ).toBe('push_11111111-1111-4111-8111-111111111111_a_b');
    expect(notificationsSmsJobId('+336:01', 'x:y')).toBe('sms_+336_01_x_y');
    expect(notificationsEmailJobId('a@b.c', 'z:1')).toBe('email_a@b.c_z_1');
  });
});
