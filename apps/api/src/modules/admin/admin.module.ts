import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { PlatformConfigModule } from '../platform-config/platform-config.module';
import { AdminBookingsController } from './admin-bookings.controller';
import { AdminBookingsService } from './admin-bookings.service';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminConfigController } from './admin-config.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDisputesController } from './admin-disputes.controller';
import { AdminDisputesService } from './admin-disputes.service';
import { AdminKycService } from './admin-kyc.service';
import { AdminZonesController } from './admin-zones.controller';
import { AdminZonesService } from './admin-zones.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    PaymentsModule,
    PlatformConfigModule,
  ],
  controllers: [
    AdminController,
    AdminCatalogController,
    AdminZonesController,
    AdminBookingsController,
    AdminDisputesController,
    AdminConfigController,
  ],
  providers: [
    AdminDashboardService,
    AdminKycService,
    AdminCatalogService,
    AdminZonesService,
    AdminBookingsService,
    AdminDisputesService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AdminDashboardService,
    AdminKycService,
    AdminCatalogService,
    AdminZonesService,
    AdminBookingsService,
    AdminDisputesService,
  ],
})
export class AdminModule {}
