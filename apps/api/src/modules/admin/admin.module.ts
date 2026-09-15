import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminKycService } from './admin-kyc.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [AdminController, AdminCatalogController],
  providers: [
    AdminDashboardService,
    AdminKycService,
    AdminCatalogService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AdminDashboardService, AdminKycService, AdminCatalogService],
})
export class AdminModule {}
