import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminDashboardService, JwtAuthGuard, RolesGuard],
  exports: [AdminDashboardService],
})
export class AdminModule {}
