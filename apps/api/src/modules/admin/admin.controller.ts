import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  AdminRejectKycDto,
  AdminRejectKycSchema,
} from '@carservice/shared-types';
import {
  AuthPayload,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminKycService } from './admin-kyc.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminController {
  constructor(
    private readonly dashboard: AdminDashboardService,
    private readonly kyc: AdminKycService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.dashboard.getDashboard();
  }

  @Get('providers/pending')
  listPendingProviders() {
    return this.kyc.listPending();
  }

  @Post('providers/:id/approve')
  @HttpCode(200)
  approveProvider(
    @CurrentUser() user: AuthPayload,
    @Param('id', ParseUUIDPipe) providerId: string,
  ) {
    return this.kyc.approve(providerId, user.sub);
  }

  @Post('providers/:id/reject')
  @HttpCode(200)
  rejectProvider(
    @Param('id', ParseUUIDPipe) providerId: string,
    @Body(new ZodValidationPipe(AdminRejectKycSchema)) dto: AdminRejectKycDto,
  ) {
    return this.kyc.reject(providerId, dto);
  }
}
