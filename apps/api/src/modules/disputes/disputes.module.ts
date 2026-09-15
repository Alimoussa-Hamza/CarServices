import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { BookingStateMachine } from '../bookings/booking-state.machine';
import { PaymentsModule } from '../payments/payments.module';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';

@Module({
  imports: [AuthModule, PaymentsModule],
  controllers: [DisputesController],
  providers: [DisputesService, BookingStateMachine, JwtAuthGuard, RolesGuard],
  exports: [DisputesService],
})
export class DisputesModule {}
