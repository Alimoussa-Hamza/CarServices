import { Injectable } from '@nestjs/common';
import type {
  PushPlatform,
  RegisterPushTokenDto,
} from '@carservice/shared-types';
import { SmsService } from '../auth/sms.service';
import { AuthPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import {
  type BookingNotificationTemplateId,
  type BookingNotificationVars,
  BOOKING_NOTIFICATION_TEMPLATES,
  renderBookingEmail,
  renderBookingSms,
} from './booking-notification.templates';
import { EmailService } from './email.service';
import { ExpoPushService } from './expo-push.service';

export type SendPushJobData = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  dedupeKey?: string;
};

export type SendSmsJobData = {
  phone: string;
  body: string;
  dedupeKey?: string;
};

export type SendEmailJobData = {
  to: string;
  subject: string;
  html: string;
  text: string;
  dedupeKey?: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expoPush: ExpoPushService,
    private readonly email: EmailService,
    private readonly sms: SmsService,
  ) {}

  async registerPushToken(user: AuthPayload, dto: RegisterPushTokenDto) {
    const saved = await this.prisma.pushToken.upsert({
      where: { token: dto.token },
      create: {
        userId: user.sub,
        token: dto.token,
        platform: dto.platform ?? null,
      },
      update: {
        userId: user.sub,
        platform: dto.platform ?? null,
      },
    });

    return {
      data: {
        id: saved.id,
        token: saved.token,
        platform: (saved.platform as PushPlatform | null) ?? null,
        updatedAt: saved.updatedAt.toISOString(),
      },
    };
  }

  async processSendPush(job: SendPushJobData) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId: job.userId },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return { sent: 0, tickets: [] as const };
    }

    const tickets = await this.expoPush.send(
      tokens.map((row) => ({
        to: row.token,
        title: job.title,
        body: job.body,
        data: job.data,
        sound: 'default' as const,
      })),
    );

    return { sent: tokens.length, tickets };
  }

  async processSendSms(job: SendSmsJobData) {
    await this.sms.send(job.phone, job.body);
    return { sent: 1 as const };
  }

  async processSendEmail(job: SendEmailJobData) {
    const result = await this.email.send({
      to: job.to,
      subject: job.subject,
      html: job.html,
      text: job.text,
    });
    return { sent: 1 as const, messageId: result.messageId };
  }

  /** Rend un template booking et retourne les payloads SMS/email prêts à enqueue. */
  buildBookingNotification(
    templateId: BookingNotificationTemplateId,
    vars: BookingNotificationVars,
  ) {
    const definition = BOOKING_NOTIFICATION_TEMPLATES[templateId];
    return {
      templateId,
      channels: definition.channels,
      email: renderBookingEmail(templateId, vars),
      sms: renderBookingSms(templateId, vars),
    };
  }
}
