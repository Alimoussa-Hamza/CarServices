import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  StripeWebhookEventSchema,
  type StripeWebhookEvent,
} from '@carservice/shared-types';
import { randomBytes, randomUUID } from 'crypto';
import { verifyStripeWebhookSignature } from './stripe-webhook';

export const STRIPE_API_VERSION = '2024-11-20.acacia';

export type StripePaymentIntent = {
  id: string;
  clientSecret: string;
};

export type StripeCapturedPaymentIntent = {
  id: string;
  status: 'succeeded';
  amountCents: number;
  applicationFeeCents: number;
};

export function isLocalMockPaymentIntent(paymentIntentId: string): boolean {
  return paymentIntentId.startsWith('pi_mock_');
}

@Injectable()
export class StripeService {
  constructor(private readonly config: ConfigService) {}

  secretKey(): string | null {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    if (!secretKey || !/^(sk|rk)_(test|live)_[A-Za-z0-9]{16,}$/.test(secretKey)) {
      return null;
    }

    return secretKey;
  }

  webhookSecret(): string | null {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')?.trim();
    if (!secret || !/^whsec_[A-Za-z0-9+/=_-]{16,}$/.test(secret)) {
      return null;
    }

    return secret;
  }

  parseWebhookEvent(
    rawBody: Buffer | undefined,
    signature: string | undefined,
    parsedBody: unknown,
  ): StripeWebhookEvent {
    const secret = this.webhookSecret();
    let payload: unknown = parsedBody;

    if (secret) {
      if (!rawBody || !signature) {
        throw new BadRequestException({
          code: 'STRIPE_WEBHOOK_INVALID_SIGNATURE',
          message: 'Signature Stripe manquante.',
          details: [],
        });
      }

      const raw = rawBody.toString('utf8');
      if (!verifyStripeWebhookSignature({ payload: raw, header: signature, secret })) {
        throw new BadRequestException({
          code: 'STRIPE_WEBHOOK_INVALID_SIGNATURE',
          message: 'Signature Stripe invalide.',
          details: [],
        });
      }

      try {
        payload = JSON.parse(raw) as unknown;
      } catch {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Payload webhook Stripe invalide.',
          details: [],
        });
      }
    }

    const parsed = StripeWebhookEventSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Événement Stripe invalide.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  async createManualCapturePaymentIntent(input: {
    amountCents: number;
    currency: 'EUR';
    metadata?: Record<string, string>;
  }): Promise<StripePaymentIntent> {
    const secretKey = this.secretKey();
    if (!secretKey) {
      const paymentIntentId = `pi_mock_${randomBytes(8).toString('hex')}`;
      return {
        id: paymentIntentId,
        clientSecret: `${paymentIntentId}_secret_${randomBytes(8).toString('hex')}`,
      };
    }

    const params = new URLSearchParams({
      amount: String(input.amountCents),
      currency: input.currency.toLowerCase(),
      capture_method: 'manual',
      'automatic_payment_methods[enabled]': 'true',
    });

    if (input.metadata) {
      for (const [key, value] of Object.entries(input.metadata)) {
        params.set(`metadata[${key}]`, value);
      }
    }

    const intent = await this.request<{ id?: string; client_secret?: string }>(
      '/v1/payment_intents',
      params,
      secretKey,
    );

    if (!intent.id || !intent.client_secret) {
      throw new ServiceUnavailableException({
        code: 'STRIPE_PAYMENT_INTENT_FAILED',
        message: 'Création du PaymentIntent impossible.',
        details: [],
      });
    }

    return { id: intent.id, clientSecret: intent.client_secret };
  }

  async capturePaymentIntent(input: {
    paymentIntentId: string;
    amountCents: number;
    applicationFeeCents: number;
  }): Promise<StripeCapturedPaymentIntent> {
    const captured: StripeCapturedPaymentIntent = {
      id: input.paymentIntentId,
      status: 'succeeded',
      amountCents: input.amountCents,
      applicationFeeCents: input.applicationFeeCents,
    };

    const secretKey = this.secretKey();
    if (!secretKey || isLocalMockPaymentIntent(input.paymentIntentId)) {
      return captured;
    }

    const params = new URLSearchParams({
      amount_to_capture: String(input.amountCents),
      'metadata[commission_cents]': String(input.applicationFeeCents),
    });

    const intent = await this.request<{ id?: string; status?: string }>(
      `/v1/payment_intents/${encodeURIComponent(input.paymentIntentId)}/capture`,
      params,
      secretKey,
    );

    if (!intent.id || intent.status !== 'succeeded') {
      throw new ServiceUnavailableException({
        code: 'STRIPE_CAPTURE_FAILED',
        message: 'Capture du PaymentIntent impossible.',
        details: { status: intent.status ?? null },
      });
    }

    return {
      ...captured,
      id: intent.id,
    };
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<{
    id: string;
    status: 'canceled';
  }> {
    const canceled = {
      id: paymentIntentId,
      status: 'canceled' as const,
    };
    const secretKey = this.secretKey();
    if (!secretKey || isLocalMockPaymentIntent(paymentIntentId)) {
      return canceled;
    }

    const intent = await this.request<{ id?: string; status?: string }>(
      `/v1/payment_intents/${encodeURIComponent(paymentIntentId)}/cancel`,
      new URLSearchParams(),
      secretKey,
    );

    if (!intent.id || intent.status !== 'canceled') {
      throw new ServiceUnavailableException({
        code: 'STRIPE_CANCEL_FAILED',
        message: 'Annulation du PaymentIntent impossible.',
        details: { status: intent.status ?? null },
      });
    }

    return { id: intent.id, status: 'canceled' };
  }

  async refundPaymentIntent(input: {
    paymentIntentId: string;
    amountCents: number;
  }): Promise<{ id: string }> {
    const secretKey = this.secretKey();
    if (!secretKey || isLocalMockPaymentIntent(input.paymentIntentId)) {
      return { id: `re_mock_${input.paymentIntentId}` };
    }

    const refund = await this.request<{ id?: string }>(
      '/v1/refunds',
      new URLSearchParams({
        payment_intent: input.paymentIntentId,
        amount: String(input.amountCents),
      }),
      secretKey,
    );

    if (!refund.id) {
      throw new ServiceUnavailableException({
        code: 'STRIPE_REFUND_FAILED',
        message: 'Remboursement Stripe impossible.',
        details: [],
      });
    }

    return { id: refund.id };
  }

  async request<T>(
    path: string,
    body: URLSearchParams,
    secretKey: string,
  ): Promise<T> {
    const response = await fetch(`https://api.stripe.com${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': STRIPE_API_VERSION,
        'Idempotency-Key': randomUUID(),
      },
      body,
    });

    if (!response.ok) {
      throw new ServiceUnavailableException({
        code: 'STRIPE_REQUEST_FAILED',
        message: 'Stripe indisponible.',
        details: { status: response.status },
      });
    }

    return (await response.json()) as T;
  }
}
