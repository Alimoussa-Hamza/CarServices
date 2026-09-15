import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  AdminCreateOfferDto,
  AdminCreateOfferOptionDto,
  AdminCreateOfferOptionSchema,
  AdminCreateOfferSchema,
  AdminUpdateCategoryDto,
  AdminUpdateCategorySchema,
  AdminUpdateOfferDto,
  AdminUpdateOfferOptionDto,
  AdminUpdateOfferOptionSchema,
  AdminUpdateOfferSchema,
} from '@carservice/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminCatalogService } from './admin-catalog.service';

@Controller('admin/catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminCatalogController {
  constructor(private readonly catalog: AdminCatalogService) {}

  @Get('categories')
  listCategories() {
    return this.catalog.listCategories();
  }

  @Patch('categories/:id')
  @HttpCode(200)
  updateCategory(
    @Param('id', ParseUUIDPipe) categoryId: string,
    @Body(new ZodValidationPipe(AdminUpdateCategorySchema))
    dto: AdminUpdateCategoryDto,
  ) {
    return this.catalog.updateCategory(categoryId, dto);
  }

  @Get('offers')
  listOffers() {
    return this.catalog.listOffers();
  }

  @Get('offers/:id')
  getOffer(@Param('id', ParseUUIDPipe) offerId: string) {
    return this.catalog.getOffer(offerId);
  }

  @Post('offers')
  createOffer(
    @Body(new ZodValidationPipe(AdminCreateOfferSchema))
    dto: AdminCreateOfferDto,
  ) {
    return this.catalog.createOffer(dto);
  }

  @Patch('offers/:id')
  @HttpCode(200)
  updateOffer(
    @Param('id', ParseUUIDPipe) offerId: string,
    @Body(new ZodValidationPipe(AdminUpdateOfferSchema))
    dto: AdminUpdateOfferDto,
  ) {
    return this.catalog.updateOffer(offerId, dto);
  }

  @Post('offers/:offerId/options')
  createOption(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body(new ZodValidationPipe(AdminCreateOfferOptionSchema))
    dto: AdminCreateOfferOptionDto,
  ) {
    return this.catalog.createOption(offerId, dto);
  }

  @Patch('options/:id')
  @HttpCode(200)
  updateOption(
    @Param('id', ParseUUIDPipe) optionId: string,
    @Body(new ZodValidationPipe(AdminUpdateOfferOptionSchema))
    dto: AdminUpdateOfferOptionDto,
  ) {
    return this.catalog.updateOption(optionId, dto);
  }
}
