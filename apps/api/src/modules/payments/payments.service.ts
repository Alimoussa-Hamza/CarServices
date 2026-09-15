import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  PLATFORM_COMMISSION_RATE,
  computePaymentSplit,
} from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from './stripe.service';

export type BookingPaymentAuthorization = {
  paymentIntentId: string;
  clientSecret: string;
  amountCents: number;
  commissionCents: number;
  providerNetCents: number;
  currency: 'EUR';
};

export type BookingPaymentCapture = {
  paymentIntentId: string;
  amountCents: number;
  commissionCents: number;
  providerNetCents: number;
  currency: 'EUR';
  status: 'captured';
  capturedAt: string;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly stripe: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  async authorizeBooking(input: {
    amountCents: number;
    commissionRate: number;
    metadata?: Record<string, string>;
  }): Promise<BookingPaymentAuthorization> {
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new BadRequestException({
        code: 'PAYMENT_AMOUNT_INVALID',
        message: 'Montant de pré-autorisation invalide.',
        details: [],
      });
    }

    const commissionRate =
      Number.isFinite(input.commissionRate) &&
      input.commissionRate > 0 &&
      input.commissionRate < 1
        ? input.commissionRate
        : PLATFORM_COMMISSION_RATE;
    const split = computePaymentSplit(input.amountCents, commissionRate);
    const intent = await this.stripe.createManualCapturePaymentIntent({
      amountCents: input.amountCents,
      currency: 'EUR',
      metadata: input.metadata,
    });

    return {
      paymentIntentId: intent.id,
      clientSecret: intent.clientSecret,
      amountCents: input.amountCents,
      commissionCents: split.commissionCents,
      providerNetCents: split.providerNetCents,
      currency: 'EUR',
    };
  }

  async captureForBooking(
    bookingId: string,
    now = new Date(),
  ): Promise<BookingPaymentCapture> {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      throw new ConflictException({
        code: 'PAYMENT_NOT_FOUND',
        message: 'Aucun paiement à capturer pour cette réservation.',
        details: [],
      });
    }

    if (payment.status === 'captured' && payment.capturedAt) {
      return {
        paymentIntentId: payment.stripePaymentIntentId,
        amountCents: payment.amountCents,
        commissionCents: payment.commissionCents,
        providerNetCents: payment.providerNetCents,
        currency: 'EUR',
        status: 'captured',
        capturedAt: payment.capturedAt.toISOString(),
      };
    }

    if (payment.status !== 'authorized') {
      throw new ConflictException({
        code: 'PAYMENT_NOT_CAPTURABLE',
        message: 'Ce paiement ne peut pas être capturé.',
        details: { status: payment.status },
      });
    }

    if (
      payment.commissionCents + payment.providerNetCents !==
      payment.amountCents
    ) {
      throw new ConflictException({
        code: 'PAYMENT_SPLIT_INVALID',
        message: 'Le split commission / net pro est incohérent.',
        details: {
          amountCents: payment.amountCents,
          commissionCents: payment.commissionCents,
          providerNetCents: payment.providerNetCents,
        },
      });
    }

    await this.stripe.capturePaymentIntent({
      paymentIntentId: payment.stripePaymentIntentId,
      amountCents: payment.amountCents,
      applicationFeeCents: payment.commissionCents,
    });

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'captured',
        capturedAt: now,
      },
    });

    return {
      paymentIntentId: updated.stripePaymentIntentId,
      amountCents: updated.amountCents,
      commissionCents: updated.commissionCents,
      providerNetCents: updated.providerNetCents,
      currency: 'EUR',
      status: 'captured',
      capturedAt: (updated.capturedAt ?? now).toISOString(),
    };
  }
}
