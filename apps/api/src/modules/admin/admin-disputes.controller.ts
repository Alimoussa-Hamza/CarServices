import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  AdminListDisputesQuery,
  AdminListDisputesQuerySchema,
  AdminResolveDisputeDto,
  AdminResolveDisputeSchema,
} from '@carservice/shared-types';
import {
  AuthPayload,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminDisputesService } from './admin-disputes.service';

@Controller('admin/disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminDisputesController {
  constructor(private readonly disputes: AdminDisputesService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(AdminListDisputesQuerySchema))
    query: AdminListDisputesQuery,
  ) {
    return this.disputes.list(query);
  }

  @Patch(':id/resolve')
  @HttpCode(200)
  resolve(
    @CurrentUser() user: AuthPayload,
    @Param('id', ParseUUIDPipe) disputeId: string,
    @Body(new ZodValidationPipe(AdminResolveDisputeSchema))
    dto: AdminResolveDisputeDto,
  ) {
    return this.disputes.resolve(disputeId, dto, user.sub);
  }
}
