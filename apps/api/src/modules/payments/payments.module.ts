import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';

@Module({
  providers: [StripeService, PaymentsService],
  exports: [StripeService, PaymentsService],
})
export class PaymentsModule {}
