import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  CreateStripeOnboardingLinkDto,
  CreateStripeOnboardingLinkSchema,
  SubmitKycDto,
  SubmitKycSchema,
  UpdateProviderAvailabilityDto,
  UpdateProviderAvailabilitySchema,
  UpdateProviderCapabilitiesDto,
  UpdateProviderCapabilitiesSchema,
  UpdateProviderProfileDto,
  UpdateProviderProfileSchema,
  UpdateProviderZonesDto,
  UpdateProviderZonesSchema,
} from '@carservice/shared-types';
import {
  AuthPayload,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { KycApprovedGuard } from '../../common/guards/kyc-approved.guard';
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

  @Get('kyc/alerts')
  getKycAlerts(@CurrentUser() user: AuthPayload) {
    return this.providersService.getKycAlerts(user.sub);
  }

  @Get('missions/eligibility')
  @UseGuards(KycApprovedGuard)
  getMissionEligibility(@CurrentUser() user: AuthPayload) {
    return this.providersService.getMissionEligibility(user.sub);
  }

  @Get('capabilities')
  listCapabilities(@CurrentUser() user: AuthPayload) {
    return this.providersService.listCapabilities(user.sub);
  }

  @Put('capabilities')
  updateCapabilities(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(UpdateProviderCapabilitiesSchema))
    dto: UpdateProviderCapabilitiesDto,
  ) {
    return this.providersService.updateCapabilities(user.sub, dto);
  }

  @Get('availability')
  getAvailability(@CurrentUser() user: AuthPayload) {
    return this.providersService.getAvailability(user.sub);
  }

  @Put('availability')
  updateAvailability(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(UpdateProviderAvailabilitySchema))
    dto: UpdateProviderAvailabilityDto,
  ) {
    return this.providersService.updateAvailability(user.sub, dto);
  }

  @Get('zones')
  listZones(@CurrentUser() user: AuthPayload) {
    return this.providersService.listZones(user.sub);
  }

  @Put('zones')
  updateZones(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(UpdateProviderZonesSchema))
    dto: UpdateProviderZonesDto,
  ) {
    return this.providersService.updateZones(user.sub, dto);
  }

  @Post('stripe/onboard')
  createStripeOnboardingLink(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(CreateStripeOnboardingLinkSchema))
    dto: CreateStripeOnboardingLinkDto,
  ) {
    return this.providersService.createStripeOnboardingLink(user.sub, dto);
  }
}
