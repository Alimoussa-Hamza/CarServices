import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-jwt-secret-change-me',
        signOptions: {
          expiresIn: config.get<number>('JWT_ACCESS_TTL_SECONDS') ?? 900,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, SmsService, JwtAuthGuard],
  exports: [AuthService, JwtModule, SmsService],
})
export class AuthModule {}
