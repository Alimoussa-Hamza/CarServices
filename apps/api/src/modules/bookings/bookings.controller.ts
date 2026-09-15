import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  CreateBookingDto,
  CreateBookingSchema,
  CancelBookingDto,
  CancelBookingSchema,
  DeclineBookingDto,
  DeclineBookingSchema,
  ListBookingsQuery,
  ListBookingsQuerySchema,
  PatchBookingStatusDto,
  PatchBookingStatusSchema,
  SlotPickerRequest,
  SlotPickerRequestSchema,
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
import { BookingsService } from './bookings.service';
import { SlotPickerService } from './slot-picker.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly slotPickerService: SlotPickerService,
  ) {}

  @Get('available')
  @Roles(UserRole.provider)
  @UseGuards(JwtAuthGuard, RolesGuard, KycApprovedGuard)
  listAvailable(@CurrentUser() user: AuthPayload) {
    return this.bookingsService.listAvailable(user.sub);
  }

  @Get()
  @Roles(UserRole.client, UserRole.provider)
  list(
    @CurrentUser() user: AuthPayload,
    @Query(new ZodValidationPipe(ListBookingsQuerySchema))
    query: ListBookingsQuery,
  ) {
    return this.bookingsService.list(user.sub, user.role, query);
  }

  @Get(':id')
  @Roles(UserRole.client, UserRole.provider)
  getById(
    @CurrentUser() user: AuthPayload,
    @Param('id', new ParseUUIDPipe()) bookingId: string,
  ) {
    return this.bookingsService.getById(user.sub, user.role, bookingId);
  }

  @Post('slots')
  @HttpCode(200)
  @Roles(UserRole.client)
  listSlots(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(SlotPickerRequestSchema)) dto: SlotPickerRequest,
  ) {
    return this.slotPickerService.listSlots(user.sub, dto);
  }

  @Post()
  @HttpCode(201)
  @Roles(UserRole.client)
  create(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(CreateBookingSchema)) dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(user.sub, dto);
  }

  @Post(':id/accept')
  @Roles(UserRole.provider)
  @UseGuards(JwtAuthGuard, RolesGuard, KycApprovedGuard)
  accept(
    @CurrentUser() user: AuthPayload,
    @Param('id', new ParseUUIDPipe()) bookingId: string,
  ) {
    return this.bookingsService.accept(user.sub, bookingId);
  }

  @Post(':id/decline')
  @Roles(UserRole.provider)
  @UseGuards(JwtAuthGuard, RolesGuard, KycApprovedGuard)
  decline(
    @CurrentUser() user: AuthPayload,
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Body(new ZodValidationPipe(DeclineBookingSchema)) _dto: DeclineBookingDto,
  ) {
    return this.bookingsService.decline(user.sub, bookingId);
  }

  @Patch(':id/status')
  @HttpCode(200)
  @Roles(UserRole.provider)
  @UseGuards(JwtAuthGuard, RolesGuard, KycApprovedGuard)
  updateStatus(
    @CurrentUser() user: AuthPayload,
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Body(new ZodValidationPipe(PatchBookingStatusSchema))
    dto: PatchBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(user.sub, bookingId, dto);
  }

  @Patch(':id/cancel')
  @HttpCode(200)
  @Roles(UserRole.client, UserRole.provider)
  cancel(
    @CurrentUser() user: AuthPayload,
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Body(new ZodValidationPipe(CancelBookingSchema)) dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancel(user.sub, user.role, bookingId, dto);
  }
}
