import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  PLATFORM_COMMISSION_RATE,
  computePaymentSplit,
  type StripeWebhookEvent,
} from '@carservice/shared-types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStateMachine } from '../bookings/booking-state.machine';
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
    private readonly stateMachine: BookingStateMachine,
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

  async processStripeEvent(
    event: StripeWebhookEvent,
    now = new Date(),
  ): Promise<{ duplicate: boolean }> {
    try {
      await this.prisma.stripeEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
        },
      });
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        return { duplicate: true };
      }
      throw error;
    }

    try {
      await this.applyStripeEvent(event, now);
    } catch (error) {
      await this.prisma.stripeEvent.delete({
        where: { stripeEventId: event.id },
      });
      throw error;
    }

    return { duplicate: false };
  }

  private async applyStripeEvent(event: StripeWebhookEvent, now: Date) {
    const object = event.data.object;
    const paymentIntentId = this.paymentIntentIdFromObject(object);

    if (event.type === 'payment_intent.succeeded' && paymentIntentId) {
      await this.markCapturedFromWebhook(paymentIntentId, now);
      return;
    }

    if (event.type === 'payment_intent.payment_failed' && paymentIntentId) {
      await this.failUnpaidBooking(paymentIntentId);
      return;
    }

    if (event.type === 'charge.refunded' && paymentIntentId) {
      await this.markRefundedFromWebhook(paymentIntentId, now);
    }
  }

  private async markCapturedFromWebhook(paymentIntentId: string, now: Date) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!payment || payment.status !== 'authorized') {
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'captured', capturedAt: now },
    });
  }

  private async failUnpaidBooking(paymentIntentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!payment || payment.status !== 'authorized') {
      return;
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: payment.bookingId },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });

      if (
        !booking ||
        (booking.status !== 'payment_authorized' &&
          booking.status !== 'pending_provider')
      ) {
        return;
      }

      this.stateMachine.assertCanTransition(
        booking.status,
        'expired',
        'system',
      );
      const history = this.stateMachine.buildHistoryEntry(
        booking.status,
        'expired',
        'system',
        { reason: 'payment_failed' },
      );

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'expired' },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: history.fromStatus,
          toStatus: history.toStatus,
          actorType: history.actorType,
          reason: history.reason,
        },
      });
    });
  }

  private async markRefundedFromWebhook(paymentIntentId: string, now: Date) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (
      !payment ||
      payment.status === 'refunded' ||
      payment.status === 'failed'
    ) {
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'refunded', refundedAt: now },
    });
  }

  private paymentIntentIdFromObject(
    object: Record<string, unknown>,
  ): string | null {
    if (typeof object.id === 'string' && object.id.startsWith('pi_')) {
      return object.id;
    }
    if (typeof object.payment_intent === 'string') {
      return object.payment_intent;
    }
    return null;
  }

  private isUniqueConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
