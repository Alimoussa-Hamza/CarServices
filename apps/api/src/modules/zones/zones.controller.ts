import { Body, Controller, Post } from '@nestjs/common';
import {
  OutOfZoneLeadDto,
  OutOfZoneLeadSchema,
  ZoneCheckDto,
  ZoneCheckSchema,
} from '@carservice/shared-types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ZonesService } from './zones.service';

@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post('check')
  check(@Body(new ZodValidationPipe(ZoneCheckSchema)) dto: ZoneCheckDto) {
    return this.zonesService.check(dto);
  }

  @Post('leads')
  createLead(
    @Body(new ZodValidationPipe(OutOfZoneLeadSchema)) dto: OutOfZoneLeadDto,
  ) {
    return this.zonesService.createLead(dto);
  }
}
