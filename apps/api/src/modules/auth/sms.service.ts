import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    await this.send(
      phone,
      `CARSERVICE — votre code : ${code}. Valide 5 minutes.`,
    );
  }

  async send(phone: string, body: string): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.config.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      this.logger.warn(`SMS non configuré — mock pour ${phone}: ${body}`);
      return;
    }

    const payload = new URLSearchParams({
      To: phone,
      From: fromNumber,
      Body: body,
    });

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
      'base64',
    );

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload,
      },
    );

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Twilio error: ${response.status} ${text}`);
      throw new Error('SMS delivery failed');
    }
  }
}
