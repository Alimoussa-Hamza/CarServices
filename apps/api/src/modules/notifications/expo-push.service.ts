import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default';
};

export type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  constructor(private readonly config: ConfigService) {}

  isMockMode(): boolean {
    return !this.config.get<string>('EXPO_ACCESS_TOKEN')?.trim();
  }

  async send(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    if (messages.length === 0) {
      return [];
    }

    if (this.isMockMode()) {
      this.logger.log(
        `[mock] Expo push ×${messages.length}: ${messages
          .map((row) => `${row.to} «${row.title}»`)
          .join('; ')}`,
      );
      return messages.map((row, index) => ({
        status: 'ok' as const,
        id: `mock_push_${index}_${row.to.slice(-8)}`,
      }));
    }

    const accessToken = this.config.get<string>('EXPO_ACCESS_TOKEN')!.trim();
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Expo push HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      data?: ExpoPushTicket | ExpoPushTicket[];
    };
    const data = payload.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data) {
      return [data];
    }
    return [];
  }
}
