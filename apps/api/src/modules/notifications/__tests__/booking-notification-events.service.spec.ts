import { PrismaService } from '../../../prisma/prisma.service';
import { BookingNotificationEventsService } from '../booking-notification-events.service';
import { NotificationsQueueService } from '../notifications-queue.service';

const bookingId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const providerId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const providerUserId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const clientUserId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

function buildService() {
  const prisma = {
    providerProfile: { findMany: jest.fn() },
    booking: { findUnique: jest.fn() },
  };
  const queue = {
    enqueuePush: jest.fn().mockResolvedValue({ queued: false, sent: 1 }),
    enqueueBookingTemplate: jest
      .fn()
      .mockResolvedValue({ templateId: 'provider_assigned', results: [] }),
  };

  return {
    service: new BookingNotificationEventsService(
      prisma as unknown as PrismaService,
      queue as unknown as NotificationsQueueService,
    ),
    prisma,
    queue,
  };
}

describe('BookingNotificationEventsService', () => {
  it('onNewMissionBroadcast enqueue push + SMS pro (RG-NOTIF)', async () => {
    const { service, prisma, queue } = buildService();
    prisma.providerProfile.findMany.mockResolvedValue([
      {
        id: providerId,
        userId: providerUserId,
        user: { phone: '+33601020304' },
      },
    ]);

    await service.onNewMissionBroadcast({
      bookingId,
      reference: 'CS-20260915-ABCD',
      slotStart: new Date('2026-09-15T14:00:00.000Z'),
      providerIds: [providerId],
    });

    expect(queue.enqueuePush).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: providerUserId,
        title: 'Nouvelle mission',
        data: { type: 'booking.new_mission', bookingId },
      }),
    );
    expect(queue.enqueueBookingTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'provider_new_mission',
        smsTo: '+33601020304',
        vars: expect.objectContaining({ reference: 'CS-20260915-ABCD' }),
      }),
    );
  });

  it('onProviderAssigned enqueue push + template client (RG-NOTIF)', async () => {
    const { service, prisma, queue } = buildService();
    prisma.booking.findUnique.mockResolvedValue({
      id: bookingId,
      reference: 'CS-20260915-ABCD',
      client: {
        userId: clientUserId,
        user: { phone: '+33601020305', email: 'client@test.fr' },
      },
    });

    await service.onProviderAssigned(bookingId);

    expect(queue.enqueuePush).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: clientUserId,
        title: 'Prestataire trouvé',
        data: { type: 'booking.provider_assigned', bookingId },
      }),
    );
    expect(queue.enqueueBookingTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'provider_assigned',
        emailTo: 'client@test.fr',
        smsTo: '+33601020305',
      }),
    );
  });

  it('onEnRoute enqueue push client uniquement', async () => {
    const { service, prisma, queue } = buildService();
    prisma.booking.findUnique.mockResolvedValue({
      id: bookingId,
      reference: 'CS-20260915-ABCD',
      client: {
        userId: clientUserId,
        user: { phone: '+33601020305', email: 'client@test.fr' },
      },
    });

    await service.onEnRoute(bookingId);

    expect(queue.enqueuePush).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: clientUserId,
        title: 'En route',
        data: { type: 'booking.en_route', bookingId },
      }),
    );
    expect(queue.enqueueBookingTemplate).not.toHaveBeenCalled();
  });

  it('onCompleted enqueue push + email client', async () => {
    const { service, prisma, queue } = buildService();
    prisma.booking.findUnique.mockResolvedValue({
      id: bookingId,
      reference: 'CS-20260915-ABCD',
      client: {
        userId: clientUserId,
        user: { phone: '+33601020305', email: 'client@test.fr' },
      },
    });

    await service.onCompleted(bookingId);

    expect(queue.enqueuePush).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: clientUserId,
        title: 'Mission terminée',
        data: { type: 'booking.completed', bookingId },
      }),
    );
    expect(queue.enqueueBookingTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'booking_completed',
        emailTo: 'client@test.fr',
      }),
    );
  });

  it('ne fait rien si providerIds vide', async () => {
    const { service, prisma, queue } = buildService();
    await service.onNewMissionBroadcast({
      bookingId,
      reference: 'CS-20260915-ABCD',
      slotStart: new Date('2026-09-15T14:00:00.000Z'),
      providerIds: [],
    });
    expect(prisma.providerProfile.findMany).not.toHaveBeenCalled();
    expect(queue.enqueuePush).not.toHaveBeenCalled();
  });
});
