import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PLATFORM_COMMISSION_RATE,
  computePaymentSplit,
} from '@carservice/shared-types';
import { StripeService } from './stripe.service';

export type BookingPaymentAuthorization = {
  paymentIntentId: string;
  clientSecret: string;
  amountCents: number;
  commissionCents: number;
  providerNetCents: number;
  currency: 'EUR';
};

@Injectable()
export class PaymentsService {
  constructor(private readonly stripe: StripeService) {}

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
}
