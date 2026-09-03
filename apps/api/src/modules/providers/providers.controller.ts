import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  SubmitKycDto,
  SubmitKycSchema,
  UpdateProviderProfileDto,
  UpdateProviderProfileSchema,
} from '@carservice/shared-types';
import {
  AuthPayload,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ProvidersService } from './providers.service';

@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.provider)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthPayload) {
    return this.providersService.getMe(user.sub);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(UpdateProviderProfileSchema))
    dto: UpdateProviderProfileDto,
  ) {
    return this.providersService.updateMe(user.sub, dto);
  }

  @Post('kyc/submit')
  submitKyc(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(SubmitKycSchema)) dto: SubmitKycDto,
  ) {
    return this.providersService.submitKyc(user.sub, dto);
  }

  @Get('kyc/status')
  getKycStatus(@CurrentUser() user: AuthPayload) {
    return this.providersService.getKycStatus(user.sub);
  }
}
