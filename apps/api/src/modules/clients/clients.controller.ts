import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  UpdateClientProfileDto,
  UpdateClientProfileSchema,
} from '@carservice/shared-types';
import {
  AuthPayload,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ClientsService } from './clients.service';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.client)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthPayload) {
    return this.clients.getMe(user.sub);
  }

  @Patch('me')
  @HttpCode(200)
  updateMe(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(UpdateClientProfileSchema))
    dto: UpdateClientProfileDto,
  ) {
    return this.clients.updateMe(user.sub, dto);
  }

  @Delete('me')
  @HttpCode(200)
  deleteMe(@CurrentUser() user: AuthPayload) {
    return this.clients.deleteMe(user.sub);
  }
}
