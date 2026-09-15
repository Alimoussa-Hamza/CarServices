import { PaymentsWebhookController } from '../payments.controller';
import { PaymentsQueueService } from '../payments-queue.service';
import { StripeService } from '../stripe.service';

describe('PaymentsWebhookController', () => {
  it('délègue POST /webhooks/stripe après parse', async () => {
    const event = {
      id: 'evt_mock_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_mock_abc' } },
    };
    const stripe = {
      parseWebhookEvent: jest.fn().mockReturnValue(event),
    };
    const queue = {
      ingest: jest.fn().mockResolvedValue({ received: true }),
    };
    const controller = new PaymentsWebhookController(
      stripe as unknown as StripeService,
      queue as unknown as PaymentsQueueService,
    );

    await expect(
      controller.handle(
        { rawBody: Buffer.from('{}') } as never,
        't=1,v1=abc',
        { id: 'ignored' },
      ),
    ).resolves.toEqual({ received: true });
    expect(stripe.parseWebhookEvent).toHaveBeenCalled();
    expect(queue.ingest).toHaveBeenCalledWith(event);
  });
});
