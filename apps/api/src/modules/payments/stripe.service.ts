import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID } from 'crypto';

export const STRIPE_API_VERSION = '2024-11-20.acacia';

export type StripePaymentIntent = {
  id: string;
  clientSecret: string;
};

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
