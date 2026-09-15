import { Injectable } from '@nestjs/common';
import { OtpService } from '../../src/modules/auth/otp.service';

/** OTP fixe pour les tests e2e (SMS mock déjà no-op sans Twilio). */
@Injectable()
export class E2eOtpService extends OtpService {
  generateCode(): string {
    return '123456';
  }
}
