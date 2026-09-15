import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProvidersModule } from '../providers/providers.module';
import { ZonesModule } from '../zones/zones.module';
import { BookingMatchingService } from './booking-matching.service';
import { BookingStateMachine } from './booking-state.machine';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { MatchingQueueService } from './matching-queue.service';
import { SlotPickerService } from './slot-picker.service';

@Module({
  imports: [
    AuthModule,
    CatalogModule,
    ZonesModule,
    ProvidersModule,
    PaymentsModule,
  ],
  controllers: [BookingsController],
  providers: [
    BookingStateMachine,
    BookingMatchingService,
    MatchingQueueService,
    BookingsService,
    SlotPickerService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    BookingStateMachine,
    BookingMatchingService,
    MatchingQueueService,
    BookingsService,
    SlotPickerService,
  ],
})
export class BookingsModule {}
