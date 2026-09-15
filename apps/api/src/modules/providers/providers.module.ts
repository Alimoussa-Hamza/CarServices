import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { KycApprovedGuard } from '../../common/guards/kyc-approved.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  imports: [AuthModule],
  controllers: [ProvidersController],
  providers: [ProvidersService, JwtAuthGuard, RolesGuard, KycApprovedGuard],
  exports: [ProvidersService, KycApprovedGuard],
})
export class ProvidersModule {}
