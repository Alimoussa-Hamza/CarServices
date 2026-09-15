import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  isMockMode(): boolean {
    return !this.config.get<string>('BREVO_API_KEY')?.trim();
  }

  async send(input: SendEmailInput): Promise<{ messageId: string | null }> {
    if (this.isMockMode()) {
      this.logger.log(
        `[mock] email → ${input.to} «${input.subject}»: ${input.text}`,
      );
      return { messageId: `mock_email_${Date.now()}` };
    }

    const apiKey = this.config.get<string>('BREVO_API_KEY')!.trim();
    const senderEmail =
      this.config.get<string>('BREVO_SENDER_EMAIL')?.trim() ||
      'noreply@carservice.fr';
    const senderName =
      this.config.get<string>('BREVO_SENDER_NAME')?.trim() || 'CARSERVICE';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Brevo email HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const payload = (await response.json()) as { messageId?: string };
    return { messageId: payload.messageId ?? null };
  }
}
