import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminKycService } from './admin-kyc.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [AdminController],
  providers: [
    AdminDashboardService,
    AdminKycService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AdminDashboardService, AdminKycService],
})
export class AdminModule {}
