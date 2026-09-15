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
});
