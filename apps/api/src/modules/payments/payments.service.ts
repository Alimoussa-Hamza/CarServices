import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PLATFORM_COMMISSION_RATE,
  computePaymentSplit,
  type PaymentStatus,
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

export type PaymentReleaseResult = {
  action:
    | 'canceled_authorization'
    | 'refunded'
    | 'partial_capture'
    | 'noop';
  paymentStatus: PaymentStatus | null;
  refundCents: number;
};

export type AdminRefundResult = {
  bookingId: string;
  status: string;
  paymentStatus: PaymentStatus;
  refundCents: number;
  currency: 'EUR';
  action: PaymentReleaseResult['action'];
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

  async releaseOrRefund(
    bookingId: string,
    refundCents: number,
    now = new Date(),
    options: { required?: boolean } = {},
  ): Promise<PaymentReleaseResult> {
    if (!Number.isInteger(refundCents) || refundCents < 0) {
      throw new BadRequestException({
        code: 'PAYMENT_AMOUNT_INVALID',
        message: 'Montant de remboursement invalide.',
        details: [],
      });
    }

    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      if (options.required) {
        throw new ConflictException({
          code: 'PAYMENT_NOT_FOUND',
          message: 'Aucun paiement à rembourser pour cette réservation.',
          details: [],
        });
      }
      return { action: 'noop', paymentStatus: null, refundCents: 0 };
    }

    if (payment.status === 'refunded') {
      return {
        action: 'noop',
        paymentStatus: 'refunded',
        refundCents: payment.amountCents,
      };
    }

    if (payment.status === 'failed') {
      if (options.required) {
        throw new ConflictException({
          code: 'PAYMENT_NOT_REFUNDABLE',
          message: 'Ce paiement ne peut pas être remboursé.',
          details: { status: payment.status },
        });
      }
      return { action: 'noop', paymentStatus: 'failed', refundCents: 0 };
    }

    const amount = payment.amountCents;
    const toRefund = Math.min(refundCents, amount);

    if (payment.status === 'authorized') {
      if (toRefund >= amount) {
        await this.stripe.cancelPaymentIntent(payment.stripePaymentIntentId);
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'refunded', refundedAt: now },
        });
        return {
          action: 'canceled_authorization',
          paymentStatus: 'refunded',
          refundCents: amount,
        };
      }

      const feeCents = amount - toRefund;
      await this.stripe.capturePaymentIntent({
        paymentIntentId: payment.stripePaymentIntentId,
        amountCents: feeCents,
        applicationFeeCents: 0,
      });
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'captured', capturedAt: now },
      });
      return {
        action: 'partial_capture',
        paymentStatus: 'captured',
        refundCents: toRefund,
      };
    }

    if (toRefund <= 0) {
      return {
        action: 'noop',
        paymentStatus: 'captured',
        refundCents: 0,
      };
    }

    await this.stripe.refundPaymentIntent({
      paymentIntentId: payment.stripePaymentIntentId,
      amountCents: toRefund,
    });

    if (toRefund >= amount) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'refunded', refundedAt: now },
      });
      return {
        action: 'refunded',
        paymentStatus: 'refunded',
        refundCents: amount,
      };
    }

    return {
      action: 'refunded',
      paymentStatus: 'captured',
      refundCents: toRefund,
    };
  }

  async adminRefund(
    bookingId: string,
    reason: string | undefined,
    adminUserId: string,
    now = new Date(),
  ): Promise<{ data: AdminRefundResult }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Réservation introuvable.',
        details: [],
      });
    }

    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });
    if (!payment) {
      throw new ConflictException({
        code: 'PAYMENT_NOT_FOUND',
        message: 'Aucun paiement à rembourser pour cette réservation.',
        details: [],
      });
    }

    const released = await this.releaseOrRefund(
      bookingId,
      payment.amountCents,
      now,
      { required: true },
    );

    let status = booking.status;
    if (
      this.stateMachine.canTransition(
        booking.status,
        'cancelled_by_admin',
        'admin',
      )
    ) {
      const history = this.stateMachine.buildHistoryEntry(
        booking.status,
        'cancelled_by_admin',
        'admin',
        { actorId: adminUserId, reason },
      );
      await this.prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'cancelled_by_admin' },
        });
        await tx.bookingStatusHistory.create({
          data: {
            bookingId,
            fromStatus: history.fromStatus,
            toStatus: history.toStatus,
            actorType: history.actorType,
            actorId: history.actorId,
            reason: history.reason,
          },
        });
      });
      status = 'cancelled_by_admin';
    }

    return {
      data: {
        bookingId,
        status,
        paymentStatus: released.paymentStatus ?? 'refunded',
        refundCents: released.refundCents,
        currency: 'EUR',
        action: released.action,
      },
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
      return;
    }

    if (event.type === 'account.updated') {
      await this.syncChargesEnabled(object);
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

  private async syncChargesEnabled(object: Record<string, unknown>) {
    const stripeAccountId =
      typeof object.id === 'string' && object.id.startsWith('acct_')
        ? object.id
        : null;
    if (!stripeAccountId || typeof object.charges_enabled !== 'boolean') {
      return;
    }

    await this.prisma.providerProfile.updateMany({
      where: { stripeAccountId },
      data: { chargesEnabled: object.charges_enabled },
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
