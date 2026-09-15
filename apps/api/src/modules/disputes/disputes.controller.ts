import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  CreateDisputeDto,
  CreateDisputeSchema,
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
import { DisputesService } from './disputes.service';

@Controller('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.client, UserRole.provider)
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Post()
  create(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(CreateDisputeSchema)) dto: CreateDisputeDto,
  ) {
    return this.disputes.create(user, dto);
  }
}
