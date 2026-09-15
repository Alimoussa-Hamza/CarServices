import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { S3Service } from './s3.service';

@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [S3Service, MediaService, JwtAuthGuard],
  exports: [S3Service, MediaService],
})
export class MediaModule {}
