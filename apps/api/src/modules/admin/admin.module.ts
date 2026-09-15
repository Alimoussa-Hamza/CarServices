import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminBookingsController } from './admin-bookings.controller';
import { AdminBookingsService } from './admin-bookings.service';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminKycService } from './admin-kyc.service';
import { AdminZonesController } from './admin-zones.controller';
import { AdminZonesService } from './admin-zones.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [
    AdminController,
    AdminCatalogController,
    AdminZonesController,
    AdminBookingsController,
  ],
  providers: [
    AdminDashboardService,
    AdminKycService,
    AdminCatalogService,
    AdminZonesService,
    AdminBookingsService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AdminDashboardService,
    AdminKycService,
    AdminCatalogService,
    AdminZonesService,
    AdminBookingsService,
  ],
})
export class AdminModule {}
