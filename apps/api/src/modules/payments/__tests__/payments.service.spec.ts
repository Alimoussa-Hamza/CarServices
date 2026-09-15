import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { StripeService } from '../stripe.service';

function buildService() {
  const stripe = {
    createManualCapturePaymentIntent: jest.fn().mockResolvedValue({
      id: 'pi_mock_abc123',
      clientSecret: 'pi_mock_abc123_secret_def',
    }),
  };

  return {
    service: new PaymentsService(stripe as unknown as StripeService),
    stripe,
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
