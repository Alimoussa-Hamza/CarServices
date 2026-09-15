import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsQueueService } from './notifications-queue.service';

/**
 * Déclencheurs RG-NOTIF pour les events mission (M09-S04) :
 * nouvelle mission (pro), pro trouvé (client), en route, terminé.
 */
@Injectable()
export class BookingNotificationEventsService {
  private readonly logger = new Logger(BookingNotificationEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: NotificationsQueueService,
  ) {}

  async onNewMissionBroadcast(input: {
    bookingId: string;
    reference: string;
    slotStart: Date;
    providerIds: string[];
  }) {
    if (input.providerIds.length === 0) {
      return;
    }

    const providers = await this.prisma.providerProfile.findMany({
      where: { id: { in: input.providerIds } },
      select: {
        id: true,
        userId: true,
        user: { select: { phone: true } },
      },
    });

    const slotLabel = input.slotStart.toISOString();

    await Promise.all(
      providers.map(async (provider) => {
        const dedupe = `new_mission_${input.bookingId}_${provider.id}`;
        try {
          await this.queue.enqueuePush({
            userId: provider.userId,
            title: 'Nouvelle mission',
            body: `Mission ${input.reference} disponible.`,
            data: {
              type: 'booking.new_mission',
              bookingId: input.bookingId,
            },
            dedupeKey: `${dedupe}_push`,
          });
          await this.queue.enqueueBookingTemplate({
            templateId: 'provider_new_mission',
            vars: { reference: input.reference, slotLabel },
            smsTo: provider.user.phone,
            dedupeKey: dedupe,
          });
        } catch (error) {
          this.logger.warn(
            `notify new_mission ${input.bookingId} → ${provider.id}: ${
              error instanceof Error ? error.message : 'unknown'
            }`,
          );
        }
      }),
    );
  }

  async onProviderAssigned(bookingId: string) {
    const booking = await this.loadClientBooking(bookingId);
    if (!booking) {
      return;
    }

    const dedupe = `provider_assigned_${bookingId}`;
    try {
      await this.queue.enqueuePush({
        userId: booking.client.userId,
        title: 'Prestataire trouvé',
        body: `Un pro a accepté ${booking.reference}.`,
        data: {
          type: 'booking.provider_assigned',
          bookingId,
        },
        dedupeKey: `${dedupe}_push`,
      });
      await this.queue.enqueueBookingTemplate({
        templateId: 'provider_assigned',
        vars: { reference: booking.reference },
        emailTo: booking.client.user.email,
        smsTo: booking.client.user.phone,
        dedupeKey: dedupe,
      });
    } catch (error) {
      this.logger.warn(
        `notify provider_assigned ${bookingId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  async onEnRoute(bookingId: string) {
    const booking = await this.loadClientBooking(bookingId);
    if (!booking) {
      return;
    }

    try {
      await this.queue.enqueuePush({
        userId: booking.client.userId,
        title: 'En route',
        body: `Le prestataire est en route pour ${booking.reference}.`,
        data: { type: 'booking.en_route', bookingId },
        dedupeKey: `en_route_${bookingId}`,
      });
    } catch (error) {
      this.logger.warn(
        `notify en_route ${bookingId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  async onCompleted(bookingId: string) {
    const booking = await this.loadClientBooking(bookingId);
    if (!booking) {
      return;
    }

    const dedupe = `completed_${bookingId}`;
    try {
      await this.queue.enqueuePush({
        userId: booking.client.userId,
        title: 'Mission terminée',
        body: `Votre mission ${booking.reference} est terminée.`,
        data: { type: 'booking.completed', bookingId },
        dedupeKey: `${dedupe}_push`,
      });
      await this.queue.enqueueBookingTemplate({
        templateId: 'booking_completed',
        vars: { reference: booking.reference },
        emailTo: booking.client.user.email,
        dedupeKey: dedupe,
      });
    } catch (error) {
      this.logger.warn(
        `notify completed ${bookingId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  private async loadClientBooking(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        reference: true,
        client: {
          select: {
            userId: true,
            user: { select: { phone: true, email: true } },
          },
        },
      },
    });
  }
}
