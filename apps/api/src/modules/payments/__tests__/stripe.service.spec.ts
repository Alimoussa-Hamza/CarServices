import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { StripeService } from '../stripe.service';

async function withMockedFetch<T>(
  fetchMock: jest.Mock,
  action: () => Promise<T>,
): Promise<T> {
  const originalFetch = global.fetch;
  global.fetch = fetchMock as unknown as typeof fetch;
  try {
    return await action();
  } finally {
    global.fetch = originalFetch;
  }
}

function serviceWithKey(key: string | undefined) {
  const config = {
    get: jest.fn().mockReturnValue(key),
  };
  return {
    service: new StripeService(config as unknown as ConfigService),
    config,
  };
}

describe('StripeService.createManualCapturePaymentIntent', () => {
  it('mocke un PI local sans clé Stripe (RG-PAY-01)', async () => {
    const { service } = serviceWithKey(undefined);

    const intent = await service.createManualCapturePaymentIntent({
      amountCents: 9000,
      currency: 'EUR',
    });

    expect(intent.id).toMatch(/^pi_mock_/);
    expect(intent.clientSecret).toContain(`${intent.id}_secret_`);
  });

  it('ignore une clé trop courte (placeholder)', async () => {
    const { service } = serviceWithKey('sk_test_placeholder');

    const intent = await service.createManualCapturePaymentIntent({
      amountCents: 9000,
      currency: 'EUR',
    });

    expect(intent.id).toMatch(/^pi_mock_/);
  });

  it('crée un PaymentIntent Stripe en capture manuelle', async () => {
    const { service } = serviceWithKey('sk_test_mocklocalkey16chars');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'pi_3liveIntentId0001',
        client_secret: 'pi_3liveIntentId0001_secret_abc',
      }),
    });

    const intent = await withMockedFetch(fetchMock, () =>
      service.createManualCapturePaymentIntent({
        amountCents: 11200,
        currency: 'EUR',
        metadata: { clientId: 'client-1', zoneSlug: 'lyon' },
      }),
    );

    expect(intent).toEqual({
      id: 'pi_3liveIntentId0001',
      clientSecret: 'pi_3liveIntentId0001_secret_abc',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.stripe.com/v1/payment_intents',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_test_mocklocalkey16chars',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Stripe-Version': '2024-11-20.acacia',
        }),
      }),
    );
    const body = String(fetchMock.mock.calls[0]?.[1]?.body);
    expect(body).toContain('amount=11200');
    expect(body).toContain('currency=eur');
    expect(body).toContain('capture_method=manual');
    expect(body).toContain('automatic_payment_methods%5Benabled%5D=true');
    expect(body).toContain('metadata%5BclientId%5D=client-1');
    expect(body).toContain('metadata%5BzoneSlug%5D=lyon');
  });

  it('lève STRIPE_REQUEST_FAILED si Stripe HTTP échoue', async () => {
    const { service } = serviceWithKey('sk_test_mocklocalkey16chars');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      withMockedFetch(fetchMock, () =>
        service.createManualCapturePaymentIntent({
          amountCents: 9000,
          currency: 'EUR',
        }),
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('lève STRIPE_PAYMENT_INTENT_FAILED si id/secret manquants', async () => {
    const { service } = serviceWithKey('sk_test_mocklocalkey16chars');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(
      withMockedFetch(fetchMock, () =>
        service.createManualCapturePaymentIntent({
          amountCents: 9000,
          currency: 'EUR',
        }),
      ),
    ).rejects.toMatchObject({
      response: { code: 'STRIPE_PAYMENT_INTENT_FAILED' },
    });
  });
});

describe('StripeService.capturePaymentIntent', () => {
  it('mocke la capture locale sans clé Stripe (RG-PAY-02)', async () => {
    const { service } = serviceWithKey(undefined);

    await expect(
      service.capturePaymentIntent({
        paymentIntentId: 'pi_mock_abc123',
        amountCents: 9000,
        applicationFeeCents: 1800,
      }),
    ).resolves.toEqual({
      id: 'pi_mock_abc123',
      status: 'succeeded',
      amountCents: 9000,
      applicationFeeCents: 1800,
    });
  });

  it('ne contacte pas Stripe pour un PI mock même avec une clé', async () => {
    const { service } = serviceWithKey('sk_test_mocklocalkey16chars');
    const fetchMock = jest.fn();

    await withMockedFetch(fetchMock, () =>
      service.capturePaymentIntent({
        paymentIntentId: 'pi_mock_abc123',
        amountCents: 9000,
        applicationFeeCents: 1800,
      }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('capture le montant et annote la commission Stripe', async () => {
    const { service } = serviceWithKey('sk_test_mocklocalkey16chars');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'pi_3liveIntentId0001',
        status: 'succeeded',
      }),
    });

    const captured = await withMockedFetch(fetchMock, () =>
      service.capturePaymentIntent({
        paymentIntentId: 'pi_3liveIntentId0001',
        amountCents: 11200,
        applicationFeeCents: 2240,
      }),
    );

    expect(captured).toEqual({
      id: 'pi_3liveIntentId0001',
      status: 'succeeded',
      amountCents: 11200,
      applicationFeeCents: 2240,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.stripe.com/v1/payment_intents/pi_3liveIntentId0001/capture',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = String(fetchMock.mock.calls[0]?.[1]?.body);
    expect(body).toContain('amount_to_capture=11200');
    expect(body).toContain('metadata%5Bcommission_cents%5D=2240');
  });

  it('lève STRIPE_CAPTURE_FAILED si le statut Stripe n’est pas succeeded', async () => {
    const { service } = serviceWithKey('sk_test_mocklocalkey16chars');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'pi_3liveIntentId0001',
        status: 'requires_capture',
      }),
    });

    await expect(
      withMockedFetch(fetchMock, () =>
        service.capturePaymentIntent({
          paymentIntentId: 'pi_3liveIntentId0001',
          amountCents: 9000,
          applicationFeeCents: 1800,
        }),
      ),
    ).rejects.toMatchObject({
      response: { code: 'STRIPE_CAPTURE_FAILED' },
    });
  });
});

const webhookPayload = JSON.stringify({
  id: 'evt_mock_1',
  type: 'payment_intent.succeeded',
  data: { object: { id: 'pi_mock_abc' } },
});

describe('StripeService.parseWebhookEvent', () => {
  it('accepte un event mock sans secret', () => {
    const { service } = serviceWithKey(undefined);
    expect(
      service.parseWebhookEvent(
        undefined,
        undefined,
        JSON.parse(webhookPayload) as unknown,
      ),
    ).toEqual({
      id: 'evt_mock_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_mock_abc' } },
    });
  });

  it('exige une signature valide si le secret est configuré', () => {
    const secret = 'whsec_mocklocalkey16chars';
    const config = {
      get: jest.fn((key: string) =>
        key === 'STRIPE_WEBHOOK_SECRET' ? secret : undefined,
      ),
    };
    const service = new StripeService(config as unknown as ConfigService);
    const timestamp = Math.floor(Date.now() / 1000);
    const digest = createHmac('sha256', secret)
      .update(`${timestamp}.${webhookPayload}`, 'utf8')
      .digest('hex');

    expect(
      service.parseWebhookEvent(
        Buffer.from(webhookPayload),
        `t=${timestamp},v1=${digest}`,
        {},
      ),
    ).toMatchObject({ id: 'evt_mock_1' });

    expect(() =>
      service.parseWebhookEvent(
        Buffer.from(webhookPayload),
        't=1,v1=deadbeef',
        {},
      ),
    ).toThrow(BadRequestException);
  });
});

describe('StripeService.cancelPaymentIntent / refundPaymentIntent', () => {
  it('mocke cancel et refund sans clé Stripe (RG-PAY-05)', async () => {
    const { service } = serviceWithKey(undefined);

    await expect(service.cancelPaymentIntent('pi_mock_abc123')).resolves.toEqual({
      id: 'pi_mock_abc123',
      status: 'canceled',
    });
    await expect(
      service.refundPaymentIntent({
        paymentIntentId: 'pi_mock_abc123',
        amountCents: 9000,
      }),
    ).resolves.toEqual({ id: 're_mock_pi_mock_abc123' });
  });

  it('appelle Stripe cancel et refund', async () => {
    const { service } = serviceWithKey('sk_test_mocklocalkey16chars');
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'pi_3liveIntentId0001', status: 'canceled' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 're_3liveRefund0001' }),
      });

    await withMockedFetch(fetchMock, async () => {
      await expect(
        service.cancelPaymentIntent('pi_3liveIntentId0001'),
      ).resolves.toEqual({
        id: 'pi_3liveIntentId0001',
        status: 'canceled',
      });
      await expect(
        service.refundPaymentIntent({
          paymentIntentId: 'pi_3liveIntentId0001',
          amountCents: 5000,
        }),
      ).resolves.toEqual({ id: 're_3liveRefund0001' });
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.stripe.com/v1/payment_intents/pi_3liveIntentId0001/cancel',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.stripe.com/v1/refunds',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(String(fetchMock.mock.calls[1]?.[1]?.body)).toContain(
      'payment_intent=pi_3liveIntentId0001',
    );
    expect(String(fetchMock.mock.calls[1]?.[1]?.body)).toContain('amount=5000');
  });
});
