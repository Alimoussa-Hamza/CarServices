import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateDisputeDto } from '@carservice/shared-types';
import { Prisma, UserRole } from '@prisma/client';
import { AuthPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStateMachine } from '../bookings/booking-state.machine';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: BookingStateMachine,
    private readonly payments: PaymentsService,
  ) {}

  async create(user: AuthPayload, dto: CreateDisputeDto, now = new Date()) {
    const actor = user.role === UserRole.provider ? 'provider' : 'client';
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        client: { select: { id: true, userId: true } },
        provider: { select: { id: true, userId: true } },
        history: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Réservation introuvable.',
        details: [],
      });
    }

    const isClientOwner =
      actor === 'client' && booking.client.userId === user.sub;
    const isAssignedProvider =
      actor === 'provider' && booking.provider?.userId === user.sub;

    if (!isClientOwner && !isAssignedProvider) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: "Vous n'êtes pas autorisé à ouvrir un litige sur cette mission.",
        details: [],
      });
    }

    const providerId = booking.providerId;
    if (!providerId) {
      throw new ConflictException({
        code: 'BOOKING_NOT_ASSIGNED',
        message: 'Aucun prestataire assigné à cette mission.',
        details: [],
      });
    }

    const existing = await this.prisma.dispute.findUnique({
      where: { bookingId: booking.id },
    });
    if (existing) {
      throw new ConflictException({
        code: 'DISPUTE_ALREADY_EXISTS',
        message: 'Un litige est déjà ouvert pour cette mission.',
        details: [],
      });
    }

    const completedAt =
      booking.history.find((row) => row.toStatus === 'completed')?.createdAt ??
      (booking.status === 'completed' ? booking.updatedAt : undefined);

    this.stateMachine.assertCanTransition(
      booking.status,
      'disputed',
      actor,
      { completedAt, now },
    );

    const history = this.stateMachine.buildHistoryEntry(
      booking.status,
      'disputed',
      actor,
      {
        actorId: actor === 'provider' ? providerId : booking.clientId,
        reason: dto.reason,
        context: { completedAt, now },
      },
    );

    try {
      const opened = await this.prisma.$transaction(async (tx) => {
        const payoutFrozenAt = await this.payments.freezePayout(
          booking.id,
          now,
          tx,
        );
        const created = await tx.dispute.create({
          data: {
            bookingId: booking.id,
            clientId: booking.clientId,
            providerId,
            openedBy: actor,
            reason: dto.reason,
            description: dto.description,
            status: 'open',
          },
        });
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'disputed' },
        });
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            fromStatus: history.fromStatus,
            toStatus: history.toStatus,
            actorType: history.actorType,
            actorId: history.actorId,
            reason: history.reason,
          },
        });
        return { created, payoutFrozenAt };
      });

      return {
        data: {
          id: opened.created.id,
          bookingId: opened.created.bookingId,
          openedBy: opened.created.openedBy,
          reason: opened.created.reason,
          description: opened.created.description,
          status: opened.created.status,
          bookingStatus: 'disputed' as const,
          payoutFrozen: true as const,
          payoutFrozenAt: opened.payoutFrozenAt.toISOString(),
          createdAt: opened.created.createdAt.toISOString(),
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'DISPUTE_ALREADY_EXISTS',
          message: 'Un litige est déjà ouvert pour cette mission.',
          details: [],
        });
      }
      throw error;
    }
  }
}
