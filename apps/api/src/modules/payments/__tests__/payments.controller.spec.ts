import { UserRole } from '@prisma/client';
import { AdminPaymentsController } from '../admin-payments.controller';
import { PaymentsService } from '../payments.service';
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

describe('AdminPaymentsController', () => {
  it('délègue POST /admin/bookings/:id/refund', async () => {
    const payments = {
      adminRefund: jest.fn().mockResolvedValue({
        data: { bookingId: '77777777-7777-4777-8777-777777777777' },
      }),
    };
    const controller = new AdminPaymentsController(
      payments as unknown as PaymentsService,
    );

    await expect(
      controller.refund(
        { sub: 'admin-1', role: UserRole.admin },
        '77777777-7777-4777-8777-777777777777',
        { reason: 'Geste commercial' },
      ),
    ).resolves.toEqual({
      data: { bookingId: '77777777-7777-4777-8777-777777777777' },
    });
    expect(payments.adminRefund).toHaveBeenCalledWith(
      '77777777-7777-4777-8777-777777777777',
      'Geste commercial',
      'admin-1',
    );
  });
});
