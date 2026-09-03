import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt } from 'crypto';

export const OTP_TTL_SECONDS = 300;
export const OTP_RATE_LIMIT_MAX = 5;
export const OTP_RATE_LIMIT_WINDOW_SECONDS = 600;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly pepper: string;

  constructor(private readonly config: ConfigService) {
    this.pepper = config.get<string>('OTP_PEPPER') ?? 'dev-otp-pepper-change-me';
  }

  generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  hashCode(code: string): string {
    return createHash('sha256').update(`${code}:${this.pepper}`).digest('hex');
  }

  otpKey(phone: string): string {
    return `otp:${phone}`;
  }

  rateLimitKey(phone: string): string {
    return `otp:rate:${phone}`;
  }

  logDevOtp(phone: string, code: string): void {
    if (this.config.get('NODE_ENV') !== 'production') {
      this.logger.log(`[DEV OTP] ${phone} → ${code}`);
    }
  }
}
