import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  AdminCreateZoneDto,
  AdminCreateZoneSchema,
  AdminUpdateZoneDto,
  AdminUpdateZoneSchema,
  AdminUpsertZonePricingDto,
  AdminUpsertZonePricingSchema,
} from '@carservice/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminZonesService } from './admin-zones.service';

@Controller('admin/zones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminZonesController {
  constructor(private readonly zones: AdminZonesService) {}

  @Get()
  listZones() {
    return this.zones.listZones();
  }

  @Post()
  createZone(
    @Body(new ZodValidationPipe(AdminCreateZoneSchema))
    dto: AdminCreateZoneDto,
  ) {
    return this.zones.createZone(dto);
  }

  @Get(':id/pricing')
  listPricing(@Param('id', ParseUUIDPipe) zoneId: string) {
    return this.zones.listPricing(zoneId);
  }

  @Put(':id/pricing/:offerId')
  @HttpCode(200)
  upsertPricing(
    @Param('id', ParseUUIDPipe) zoneId: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body(new ZodValidationPipe(AdminUpsertZonePricingSchema))
    dto: AdminUpsertZonePricingDto,
  ) {
    return this.zones.upsertPricing(zoneId, offerId, dto);
  }

  @Get(':id')
  getZone(@Param('id', ParseUUIDPipe) zoneId: string) {
    return this.zones.getZone(zoneId);
  }

  @Patch(':id')
  @HttpCode(200)
  updateZone(
    @Param('id', ParseUUIDPipe) zoneId: string,
    @Body(new ZodValidationPipe(AdminUpdateZoneSchema))
    dto: AdminUpdateZoneDto,
  ) {
    return this.zones.updateZone(zoneId, dto);
  }
}
