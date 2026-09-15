import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BookingStateMachine } from '../../bookings/booking-state.machine';
import { PaymentsService } from '../../payments/payments.service';
import { DisputesService } from '../disputes.service';

const bookingId = '77777777-7777-4777-8777-777777777777';
const clientUserId = '11111111-1111-4111-8111-111111111111';
const clientId = '22222222-2222-4222-8222-222222222222';
const providerUserId = '88888888-8888-4888-8888-888888888888';
const providerId = '33333333-3333-4333-8333-333333333333';
const now = new Date('2026-09-15T21:00:00.000Z');
const completedAt = new Date('2026-09-15T12:00:00.000Z');

const dto = {
  bookingId,
  reason: 'quality' as const,
  description: 'Prestation incomplète, traces partout.',
};

function completedBooking() {
  return {
    id: bookingId,
    status: 'completed',
    clientId,
    providerId,
    updatedAt: completedAt,
    client: { id: clientId, userId: clientUserId },
    provider: { id: providerId, userId: providerUserId },
    history: [{ toStatus: 'completed', createdAt: completedAt }],
  };
}

function buildService(booking?: object | null) {
  const created = {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    bookingId,
    openedBy: 'client',
    reason: 'quality',
    description: dto.description,
    status: 'open',
    createdAt: now,
  };
  const prisma = {
    booking: {
      findUnique: jest
        .fn()
        .mockResolvedValue(booking === undefined ? completedBooking() : booking),
      update: jest.fn().mockResolvedValue({ status: 'disputed' }),
    },
    dispute: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(created),
    },
    bookingStatusHistory: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
  );
  const payments = {
    freezePayout: jest.fn().mockResolvedValue(now),
  };

  return {
    service: new DisputesService(
      prisma as unknown as PrismaService,
      new BookingStateMachine(),
      payments as unknown as PaymentsService,
    ),
    prisma,
    payments,
    created,
  };
}

describe('DisputesService.create', () => {
  const client = { sub: clientUserId, role: UserRole.client };

  it('ouvre un litige, passe en disputed et gèle le payout (RG-DISPUTE-03)', async () => {
    const { service, payments, prisma } = buildService();

    const result = await service.create(client, dto, now);

    expect(result.data).toMatchObject({
      bookingId,
      openedBy: 'client',
      reason: 'quality',
      status: 'open',
      bookingStatus: 'disputed',
      payoutFrozen: true,
      payoutFrozenAt: now.toISOString(),
    });
    expect(payments.freezePayout).toHaveBeenCalledWith(bookingId, now, prisma);
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: bookingId },
      data: { status: 'disputed' },
    });
  });

  it('refuse un booking introuvable', async () => {
    const { service } = buildService(null);
    await expect(service.create(client, dto, now)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refuse un client non propriétaire', async () => {
    const { service } = buildService();
    await expect(
      service.create(
        { sub: '99999999-9999-4999-8999-999999999999', role: UserRole.client },
        dto,
        now,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuse un second litige', async () => {
    const { service, prisma } = buildService();
    prisma.dispute.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.create(client, dto, now)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('refuse hors fenêtre 48 h (RG-DISPUTE-01)', async () => {
    const { service } = buildService();
    const late = new Date(completedAt.getTime() + 49 * 60 * 60 * 1000);
    await expect(service.create(client, dto, late)).rejects.toMatchObject({
      response: { code: 'BOOKING_DISPUTE_WINDOW_EXPIRED' },
    });
  });
});
