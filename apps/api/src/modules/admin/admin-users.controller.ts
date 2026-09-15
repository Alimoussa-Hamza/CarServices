import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  AdminListUsersQuery,
  AdminListUsersQuerySchema,
  AdminUpdateUserDto,
  AdminUpdateUserSchema,
} from '@carservice/shared-types';
import {
  AuthPayload,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminUsersService } from './admin-users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(AdminListUsersQuerySchema))
    query: AdminListUsersQuery,
  ) {
    return this.users.list(query);
  }

  @Patch(':id')
  @HttpCode(200)
  update(
    @CurrentUser() actor: AuthPayload,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body(new ZodValidationPipe(AdminUpdateUserSchema)) dto: AdminUpdateUserDto,
  ) {
    return this.users.update(userId, dto, actor.sub);
  }
}
