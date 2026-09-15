import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  AdminUpdatePlatformConfigDto,
  AdminUpdatePlatformConfigSchema,
} from '@carservice/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PlatformConfigService } from '../platform-config/platform-config.service';

@Controller('admin/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminConfigController {
  constructor(private readonly config: PlatformConfigService) {}

  @Get()
  async getConfig() {
    return { data: await this.config.getPublicConfig() };
  }

  @Patch()
  @HttpCode(200)
  updateConfig(
    @Body(new ZodValidationPipe(AdminUpdatePlatformConfigSchema))
    dto: AdminUpdatePlatformConfigDto,
  ) {
    return this.config.update(dto);
  }
}
