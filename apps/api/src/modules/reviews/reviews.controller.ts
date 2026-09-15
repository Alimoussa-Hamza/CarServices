import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  CreateReviewDto,
  CreateReviewSchema,
  ListProviderReviewsQuery,
  ListProviderReviewsQuerySchema,
} from '@carservice/shared-types';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import {
  AuthPayload,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.client)
  create(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(CreateReviewSchema)) dto: CreateReviewDto,
  ) {
    return this.reviews.create(user, dto);
  }

  @Get('provider/:id')
  listByProvider(
    @Param('id', new ZodValidationPipe(z.string().uuid())) providerId: string,
    @Query(new ZodValidationPipe(ListProviderReviewsQuerySchema))
    query: ListProviderReviewsQuery,
  ) {
    return this.reviews.listByProvider(providerId, query);
  }
}
