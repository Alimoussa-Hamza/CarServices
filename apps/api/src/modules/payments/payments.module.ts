import { Module } from '@nestjs/common';
import { BookingStateMachine } from '../bookings/booking-state.machine';
import { PaymentsWebhookController } from './payments.controller';
import { PaymentsQueueService } from './payments-queue.service';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';

@Module({
  controllers: [PaymentsWebhookController],
  providers: [
    StripeService,
    PaymentsService,
    PaymentsQueueService,
    BookingStateMachine,
  ],
  exports: [StripeService, PaymentsService],
})
export class PaymentsModule {}
