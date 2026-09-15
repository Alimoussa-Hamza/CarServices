import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { ExpoPushService } from './expo-push.service';
import { NotificationsQueueService } from './notifications-queue.service';
import { NotificationsService } from './notifications.service';
import { UsersController } from './users.controller';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    NotificationsService,
    ExpoPushService,
    NotificationsQueueService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [NotificationsService, NotificationsQueueService, ExpoPushService],
})
export class NotificationsModule {}
