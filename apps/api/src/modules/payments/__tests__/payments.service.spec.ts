import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BookingStateMachine } from '../../bookings/booking-state.machine';
import { PaymentsService } from '../payments.service';
import { StripeService } from '../stripe.service';

const bookingId = '77777777-7777-4777-8777-777777777777';
const paymentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const now = new Date('2026-09-13T15:45:00.000Z');

const authorizedPayment = {
  id: paymentId,
  bookingId,
  stripePaymentIntentId: 'pi_mock_abc123',
  amountCents: 9000,
  commissionCents: 1800,
  providerNetCents: 7200,
  currency: 'EUR',
  status: 'authorized' as const,
  capturedAt: null,
  refundedAt: null,
  payoutFrozenAt: null,
};

function buildService() {
  const stripe = {
    createManualCapturePaymentIntent: jest.fn().mockResolvedValue({
      id: 'pi_mock_abc123',
      clientSecret: 'pi_mock_abc123_secret_def',
    }),
    capturePaymentIntent: jest.fn().mockResolvedValue({
      id: 'pi_mock_abc123',
      status: 'succeeded',
      amountCents: 9000,
      applicationFeeCents: 1800,
    }),
    cancelPaymentIntent: jest.fn().mockResolvedValue({
      id: 'pi_mock_abc123',
      status: 'canceled',
    }),
    refundPaymentIntent: jest.fn().mockResolvedValue({
      id: 're_mock_pi_mock_abc123',
    }),
  };
  const prisma = {
    payment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    stripeEvent: {
      create: jest.fn().mockResolvedValue({}),
      delete: jest.fn(),
    },
    providerProfile: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bookingStatusHistory: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
  );

  return {
    service: new PaymentsService(
      stripe as unknown as StripeService,
      prisma as unknown as PrismaService,
      new BookingStateMachine(),
    ),
    stripe,
    prisma,
  };
}

describe('PaymentsService.authorizeBooking', () => {
  it('pré-autorise le snapshot et calcule le split (RG-PAY-01/03)', async () => {
    const { service, stripe } = buildService();

    await expect(
      service.authorizeBooking({
        amountCents: 9000,
        commissionRate: 0.2,
        metadata: { zoneSlug: 'lyon' },
      }),
    ).resolves.toEqual({
      paymentIntentId: 'pi_mock_abc123',
      clientSecret: 'pi_mock_abc123_secret_def',
      amountCents: 9000,
      commissionCents: 1800,
      providerNetCents: 7200,
      currency: 'EUR',
    });
    expect(stripe.createManualCapturePaymentIntent).toHaveBeenCalledWith({
      amountCents: 9000,
      currency: 'EUR',
      metadata: { zoneSlug: 'lyon' },
    });
  });

  it('rejette un montant invalide avant l’appel Stripe', async () => {
    const { service, stripe } = buildService();

    await expect(
      service.authorizeBooking({ amountCents: 0, commissionRate: 0.2 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(stripe.createManualCapturePaymentIntent).not.toHaveBeenCalled();
  });

  it('propage l’échec Stripe (RG-PAY-06)', async () => {
    const { service, stripe } = buildService();
    stripe.createManualCapturePaymentIntent.mockRejectedValue(
      new ServiceUnavailableException({
        code: 'STRIPE_REQUEST_FAILED',
        message: 'Stripe indisponible.',
        details: [],
      }),
    );

    await expect(
      service.authorizeBooking({ amountCents: 9000, commissionRate: 0.2 }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

describe('PaymentsService.captureForBooking', () => {
  it('capture le PI et fige la commission (RG-PAY-02/03)', async () => {
    const { service, stripe, prisma } = buildService();
    prisma.payment.findUnique.mockResolvedValue(authorizedPayment);
    prisma.payment.update.mockResolvedValue({
      ...authorizedPayment,
      status: 'captured',
      capturedAt: now,
    });

    await expect(service.captureForBooking(bookingId, now)).resolves.toEqual({
      paymentIntentId: 'pi_mock_abc123',
      amountCents: 9000,
      commissionCents: 1800,
      providerNetCents: 7200,
      currency: 'EUR',
      status: 'captured',
      capturedAt: now.toISOString(),
    });
    expect(stripe.capturePaymentIntent).toHaveBeenCalledWith({
      paymentIntentId: 'pi_mock_abc123',
      amountCents: 9000,
      applicationFeeCents: 1800,
    });
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: paymentId },
      data: { status: 'captured', capturedAt: now },
    });
  });

  it('est idempotent si déjà captured', async () => {
    const { service, stripe, prisma } = buildService();
    prisma.payment.findUnique.mockResolvedValue({
      ...authorizedPayment,
      status: 'captured',
      capturedAt: now,
    });

    await expect(service.captureForBooking(bookingId, now)).resolves.toEqual({
      paymentIntentId: 'pi_mock_abc123',
      amountCents: 9000,
      commissionCents: 1800,
      providerNetCents: 7200,
      currency: 'EUR',
      status: 'captured',
      capturedAt: now.toISOString(),
    });
    expect(stripe.capturePaymentIntent).not.toHaveBeenCalled();
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('refuse un paiement introuvable', async () => {
    const { service, prisma, stripe } = buildService();
    prisma.payment.findUnique.mockResolvedValue(null);

    await expect(service.captureForBooking(bookingId, now)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(stripe.capturePaymentIntent).not.toHaveBeenCalled();
  });

  it('refuse un split commission incohérent', async () => {
    const { service, prisma, stripe } = buildService();
    prisma.payment.findUnique.mockResolvedValue({
      ...authorizedPayment,
      commissionCents: 1000,
    });

    await expect(service.captureForBooking(bookingId, now)).rejects.toMatchObject({
      response: { code: 'PAYMENT_SPLIT_INVALID' },
    });
    expect(stripe.capturePaymentIntent).not.toHaveBeenCalled();
  });

  it('n’écrit pas captured si Stripe échoue', async () => {
    const { service, prisma, stripe } = buildService();
    prisma.payment.findUnique.mockResolvedValue(authorizedPayment);
    stripe.capturePaymentIntent.mockRejectedValue(
      new ServiceUnavailableException({
        code: 'STRIPE_CAPTURE_FAILED',
        message: 'Capture du PaymentIntent impossible.',
        details: [],
      }),
    );

    await expect(service.captureForBooking(bookingId, now)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });
});

describe('PaymentsService.processStripeEvent', () => {
  const failedEvent = {
    id: 'evt_mock_payment_failed_1',
    type: 'payment_intent.payment_failed',
    data: { object: { id: 'pi_mock_abc123' } },
  };

  it('marque le paiement failed et expire le booking unpaid (RG-PAY-06)', async () => {
    const { service, prisma } = buildService();
    prisma.payment.findUnique.mockResolvedValue(authorizedPayment);
    prisma.booking.findUnique.mockResolvedValue({
      id: bookingId,
      status: 'pending_provider',
    });

    await expect(service.processStripeEvent(failedEvent, now)).resolves.toEqual({
      duplicate: false,
    });
    expect(prisma.stripeEvent.create).toHaveBeenCalledWith({
      data: {
        stripeEventId: 'evt_mock_payment_failed_1',
        type: 'payment_intent.payment_failed',
      },
    });
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: paymentId },
      data: { status: 'failed' },
    });
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: bookingId },
      data: { status: 'expired' },
    });
  });

  it('est idempotent si l’event id est déjà stocké', async () => {
    const { service, prisma } = buildService();
    const conflict = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '6.6.0' },
    );
    prisma.stripeEvent.create.mockRejectedValue(conflict);

    await expect(service.processStripeEvent(failedEvent, now)).resolves.toEqual({
      duplicate: true,
    });
    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });

  it('confirme captured sur payment_intent.succeeded', async () => {
    const { service, prisma } = buildService();
    prisma.payment.findUnique.mockResolvedValue(authorizedPayment);

    await expect(
      service.processStripeEvent(
        {
          id: 'evt_mock_pi_succeeded_1',
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_mock_abc123' } },
        },
        now,
      ),
    ).resolves.toEqual({ duplicate: false });
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: paymentId },
      data: { status: 'captured', capturedAt: now },
    });
  });

  it('synchronise charges_enabled sur account.updated', async () => {
    const { service, prisma } = buildService();

    await expect(
      service.processStripeEvent(
        {
          id: 'evt_mock_account_updated_1',
          type: 'account.updated',
          data: {
            object: { id: 'acct_mock_proA', charges_enabled: true },
          },
        },
        now,
      ),
    ).resolves.toEqual({ duplicate: false });
    expect(prisma.providerProfile.updateMany).toHaveBeenCalledWith({
      where: { stripeAccountId: 'acct_mock_proA' },
      data: { chargesEnabled: true },
    });
  });

  it('ignore un account.updated sans charges_enabled booléen', async () => {
    const { service, prisma } = buildService();

    await expect(
      service.processStripeEvent(
        {
          id: 'evt_mock_account_updated_noop',
          type: 'account.updated',
          data: { object: { id: 'acct_mock_proA' } },
        },
        now,
      ),
    ).resolves.toEqual({ duplicate: false });
    expect(prisma.providerProfile.updateMany).not.toHaveBeenCalled();
  });
});

describe('PaymentsService.releaseOrRefund / adminRefund', () => {
  const adminId = '99999999-9999-4999-8999-999999999999';

  it('annule l’auth Stripe si authorized (RG-PAY-05)', async () => {
    const { service, stripe, prisma } = buildService();
    prisma.payment.findUnique.mockResolvedValue(authorizedPayment);

    await expect(
      service.releaseOrRefund(bookingId, 9000, now),
    ).resolves.toEqual({
      action: 'canceled_authorization',
      paymentStatus: 'refunded',
      refundCents: 9000,
    });
    expect(stripe.cancelPaymentIntent).toHaveBeenCalledWith('pi_mock_abc123');
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: paymentId },
      data: { status: 'refunded', refundedAt: now },
    });
  });

  it('capture uniquement les frais si remboursement partiel sur auth', async () => {
    const { service, stripe, prisma } = buildService();
    prisma.payment.findUnique.mockResolvedValue(authorizedPayment);

    await expect(
      service.releaseOrRefund(bookingId, 7200, now),
    ).resolves.toEqual({
      action: 'partial_capture',
      paymentStatus: 'captured',
      refundCents: 7200,
    });
    expect(stripe.capturePaymentIntent).toHaveBeenCalledWith({
      paymentIntentId: 'pi_mock_abc123',
      amountCents: 1800,
      applicationFeeCents: 0,
    });
  });

  it('rembourse un paiement déjà capturé', async () => {
    const { service, stripe, prisma } = buildService();
    prisma.payment.findUnique.mockResolvedValue({
      ...authorizedPayment,
      status: 'captured',
      capturedAt: now,
    });

    await expect(
      service.releaseOrRefund(bookingId, 9000, now),
    ).resolves.toEqual({
      action: 'refunded',
      paymentStatus: 'refunded',
      refundCents: 9000,
    });
    expect(stripe.refundPaymentIntent).toHaveBeenCalledWith({
      paymentIntentId: 'pi_mock_abc123',
      amountCents: 9000,
    });
  });

  it('refund admin annule le booking unpaid (RG-PAY-05)', async () => {
    const { service, prisma } = buildService();
    prisma.booking.findUnique.mockResolvedValue({
      id: bookingId,
      status: 'pending_provider',
    });
    prisma.payment.findUnique.mockResolvedValue(authorizedPayment);

    await expect(
      service.adminRefund(bookingId, 'Litige qualité', adminId, now),
    ).resolves.toEqual({
      data: {
        bookingId,
        status: 'cancelled_by_admin',
        paymentStatus: 'refunded',
        refundCents: 9000,
        currency: 'EUR',
        action: 'canceled_authorization',
      },
    });
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: bookingId },
      data: { status: 'cancelled_by_admin' },
    });
  });
});

describe('PaymentsService.freezePayout', () => {
  it('pose payoutFrozenAt si le paiement n’est pas encore gelé', async () => {
    const { service, prisma } = buildService();
    prisma.payment.findUnique.mockResolvedValue({
      ...authorizedPayment,
      status: 'captured',
    });
    prisma.payment.update.mockResolvedValue({
      ...authorizedPayment,
      status: 'captured',
      payoutFrozenAt: now,
    });

    await expect(service.freezePayout(bookingId, now)).resolves.toEqual(now);
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: paymentId },
      data: { payoutFrozenAt: now },
    });
  });

  it('est idempotent si déjà gelé', async () => {
    const { service, prisma } = buildService();
    prisma.payment.findUnique.mockResolvedValue({
      ...authorizedPayment,
      status: 'captured',
      payoutFrozenAt: now,
    });

    await expect(service.freezePayout(bookingId, now)).resolves.toEqual(now);
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('lève PAYMENT_NOT_FOUND si aucun paiement', async () => {
    const { service, prisma } = buildService();
    prisma.payment.findUnique.mockResolvedValue(null);

    await expect(service.freezePayout(bookingId, now)).rejects.toMatchObject({
      response: { code: 'PAYMENT_NOT_FOUND' },
    });
  });
});
