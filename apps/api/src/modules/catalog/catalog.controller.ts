import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CatalogQuoteDto, CatalogQuoteSchema } from '@carservice/shared-types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Get('offers')
  listOffers(@Query('zone') zoneSlug?: string) {
    return this.catalogService.listOffers(zoneSlug);
  }

  @Get('offers/:id')
  getOffer(@Param('id') id: string) {
    return this.catalogService.getOffer(id);
  }

  @Post('quote')
  quote(@Body(new ZodValidationPipe(CatalogQuoteSchema)) dto: CatalogQuoteDto) {
    return this.catalogService.quote(dto);
  }
}
