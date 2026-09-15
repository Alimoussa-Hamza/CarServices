import { notificationsPushJobId } from '../notifications-queue.service';

describe('notificationsPushJobId', () => {
  it('évite les « : » interdits par BullMQ 6', () => {
    expect(
      notificationsPushJobId('11111111-1111-4111-8111-111111111111', 'a:b'),
    ).toBe('push_11111111-1111-4111-8111-111111111111_a_b');
  });
});
