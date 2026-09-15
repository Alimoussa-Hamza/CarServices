import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { NotificationsService } from './notifications.service';
import { UsersController } from './users.controller';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [NotificationsService, JwtAuthGuard, RolesGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
