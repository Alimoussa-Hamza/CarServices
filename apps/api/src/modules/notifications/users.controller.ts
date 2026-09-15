import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  RegisterPushTokenDto,
  RegisterPushTokenSchema,
} from '@carservice/shared-types';
import { UserRole } from '@prisma/client';
import {
  AuthPayload,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { NotificationsService } from './notifications.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.client, UserRole.provider)
export class UsersController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('push-token')
  registerPushToken(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(RegisterPushTokenSchema))
    dto: RegisterPushTokenDto,
  ) {
    return this.notifications.registerPushToken(user, dto);
  }
}
