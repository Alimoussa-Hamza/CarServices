import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  AdminRefundBookingDto,
  AdminRefundBookingSchema,
} from '@carservice/shared-types';
import {
  AuthPayload,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PaymentsService } from './payments.service';

@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(':id/refund')
  @HttpCode(200)
  refund(
    @CurrentUser() user: AuthPayload,
    @Param('id', ParseUUIDPipe) bookingId: string,
    @Body(new ZodValidationPipe(AdminRefundBookingSchema))
    dto: AdminRefundBookingDto,
  ) {
    return this.payments.adminRefund(bookingId, dto.reason, user.sub);
  }
}
