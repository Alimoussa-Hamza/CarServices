import {
  Body,
  Controller,
  Delete,
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
  CreateAddressDto,
  CreateAddressSchema,
  UpdateAddressDto,
  UpdateAddressSchema,
} from '@carservice/shared-types';
import {
  AuthPayload,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AddressesService } from './addresses.service';

@Controller('addresses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.client)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentUser() user: AuthPayload) {
    return this.addresses.list(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(CreateAddressSchema)) dto: CreateAddressDto,
  ) {
    return this.addresses.create(user.sub, dto);
  }

  @Patch(':id')
  @HttpCode(200)
  update(
    @CurrentUser() user: AuthPayload,
    @Param('id', ParseUUIDPipe) addressId: string,
    @Body(new ZodValidationPipe(UpdateAddressSchema)) dto: UpdateAddressDto,
  ) {
    return this.addresses.update(user.sub, addressId, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(
    @CurrentUser() user: AuthPayload,
    @Param('id', ParseUUIDPipe) addressId: string,
  ) {
    return this.addresses.remove(user.sub, addressId);
  }
}
