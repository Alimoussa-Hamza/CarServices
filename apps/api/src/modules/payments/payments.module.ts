import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { BookingStateMachine } from '../bookings/booking-state.machine';
import { AdminPaymentsController } from './admin-payments.controller';
import { PaymentsWebhookController } from './payments.controller';
import { PaymentsQueueService } from './payments-queue.service';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsWebhookController, AdminPaymentsController],
  providers: [
    StripeService,
    PaymentsService,
    PaymentsQueueService,
    BookingStateMachine,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [StripeService, PaymentsService],
})
export class PaymentsModule {}
