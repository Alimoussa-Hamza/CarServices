import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

@Module({
  imports: [AuthModule],
  controllers: [AddressesController],
  providers: [AddressesService, JwtAuthGuard, RolesGuard],
  exports: [AddressesService],
})
export class AddressesModule {}
