import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  AdminListBookingsQuery,
  AdminListBookingsQuerySchema,
} from '@carservice/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminBookingsService } from './admin-bookings.service';

@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminBookingsController {
  constructor(private readonly bookings: AdminBookingsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(AdminListBookingsQuerySchema))
    query: AdminListBookingsQuery,
  ) {
    return this.bookings.list(query);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) bookingId: string) {
    return this.bookings.getById(bookingId);
  }
}
