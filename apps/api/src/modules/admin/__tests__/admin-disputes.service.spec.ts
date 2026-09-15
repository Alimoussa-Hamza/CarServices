import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentsService } from '../../payments/payments.service';
import { AdminDisputesService } from '../admin-disputes.service';

const disputeId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const bookingId = '77777777-7777-4777-8777-777777777777';
const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const providerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function buildService() {
  const prisma = {
    dispute: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (ops: Promise<unknown>[]) =>
      Promise.all(ops),
    ),
  };
  const payments = {
    releaseOrRefund: jest.fn(),
    unfreezePayout: jest.fn(),
  };

  return {
    service: new AdminDisputesService(
      prisma as unknown as PrismaService,
      payments as unknown as PaymentsService,
    ),
    prisma,
    payments,
  };
}

describe('AdminDisputesService', () => {
  it('liste les litiges ouverts par défaut', async () => {
    const { service, prisma } = buildService();
    prisma.dispute.count.mockResolvedValue(1);
    prisma.dispute.findMany.mockResolvedValue([
      {
        id: disputeId,
        bookingId,
        openedBy: 'client',
        reason: 'quality',
        description: 'Lavage incomplet sur le toit',
        status: 'open',
        createdAt: new Date('2026-09-16T12:00:00.000Z'),
        booking: {
          reference: 'CS-20260916-ABCD',
          payment: { payoutFrozenAt: new Date('2026-09-16T12:00:00.000Z') },
        },
        client: {
          firstName: 'Alice',
          lastName: 'Martin',
          user: { phone: '+33601020304' },
        },
        provider: { id: providerId, companyName: 'Pro Wash' },
      },
    ]);

    const result = await service.list({ page: 1, pageSize: 20 });
    expect(prisma.dispute.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ['open', 'under_review'] } },
      }),
    );
    expect(result.data.items[0]).toMatchObject({
      bookingReference: 'CS-20260916-ABCD',
      payoutFrozen: true,
    });
  });

  it('resolved_client rembourse et débloque le payout', async () => {
    const { service, prisma, payments } = buildService();
    prisma.dispute.findUnique.mockResolvedValue({
      id: disputeId,
      bookingId,
      status: 'open',
      booking: {
        payment: { amountCents: 9500, status: 'captured' },
      },
    });
    payments.releaseOrRefund.mockResolvedValue({
      action: 'refunded',
      paymentStatus: 'refunded',
      refundCents: 9500,
    });
    prisma.dispute.update.mockResolvedValue({
      id: disputeId,
      bookingId,
      status: 'resolved_client',
      resolutionNotes: 'Geste commercial',
      resolvedAt: new Date('2026-09-16T14:00:00.000Z'),
    });
    prisma.payment.findUnique.mockResolvedValue({
      payoutFrozenAt: null,
      status: 'refunded',
    });

    await expect(
      service.resolve(
        disputeId,
        { decision: 'resolved_client', notes: 'Geste commercial' },
        adminId,
        new Date('2026-09-16T14:00:00.000Z'),
      ),
    ).resolves.toMatchObject({
      data: {
        status: 'resolved_client',
        paymentAction: 'refunded',
        refundCents: 9500,
        payoutFrozen: false,
      },
    });
    expect(payments.unfreezePayout).toHaveBeenCalledWith(bookingId);
  });

  it('resolved_provider débloque sans refund', async () => {
    const { service, prisma, payments } = buildService();
    prisma.dispute.findUnique.mockResolvedValue({
      id: disputeId,
      bookingId,
      status: 'under_review',
      booking: {
        payment: { amountCents: 9500, status: 'captured' },
      },
    });
    prisma.dispute.update.mockResolvedValue({
      id: disputeId,
      bookingId,
      status: 'resolved_provider',
      resolutionNotes: null,
      resolvedAt: new Date('2026-09-16T14:00:00.000Z'),
    });
    prisma.payment.findUnique.mockResolvedValue({
      payoutFrozenAt: null,
      status: 'captured',
    });

    await expect(
      service.resolve(disputeId, { decision: 'resolved_provider' }, adminId),
    ).resolves.toMatchObject({
      data: { paymentAction: 'unfrozen', refundCents: 0 },
    });
    expect(payments.releaseOrRefund).not.toHaveBeenCalled();
    expect(payments.unfreezePayout).toHaveBeenCalledWith(bookingId);
  });

  it('404 / 409 sur litige absent ou déjà résolu', async () => {
    const { service, prisma } = buildService();
    prisma.dispute.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.resolve(disputeId, { decision: 'resolved_provider' }, adminId),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.dispute.findUnique.mockResolvedValueOnce({
      id: disputeId,
      bookingId,
      status: 'resolved_client',
      booking: { payment: null },
    });
    await expect(
      service.resolve(disputeId, { decision: 'resolved_provider' }, adminId),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
