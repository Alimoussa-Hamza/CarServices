import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  CreateMediaUploadUrlDto,
  CreateMediaUploadUrlSchema,
} from '@carservice/shared-types';
import {
  AuthPayload,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { MediaService } from './media.service';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload-url')
  @HttpCode(200)
  createUploadUrl(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(CreateMediaUploadUrlSchema))
    dto: CreateMediaUploadUrlDto,
  ) {
    return this.media.createUploadUrl(user, dto);
  }
}
