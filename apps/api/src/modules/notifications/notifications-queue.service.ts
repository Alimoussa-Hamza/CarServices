import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsOptions, Queue, Worker } from 'bullmq';
import { redisConnectionFromUrl } from '../bookings/matching-timeouts';
import {
  NotificationsService,
  type SendEmailJobData,
  type SendPushJobData,
  type SendSmsJobData,
} from './notifications.service';
import type {
  BookingNotificationTemplateId,
  BookingNotificationVars,
} from './booking-notification.templates';

export const NOTIFICATIONS_QUEUE_NAME = 'notifications';
export const NOTIFICATIONS_JOB_SEND_PUSH = 'send-push';
export const NOTIFICATIONS_JOB_SEND_SMS = 'send-sms';
export const NOTIFICATIONS_JOB_SEND_EMAIL = 'send-email';

export function notificationsPushJobId(
  userId: string,
  dedupeKey: string,
): string {
  return `push_${userId}_${dedupeKey}`.replaceAll(':', '_');
}

export function notificationsSmsJobId(
  phone: string,
  dedupeKey: string,
): string {
  return `sms_${phone}_${dedupeKey}`.replaceAll(':', '_');
}

export function notificationsEmailJobId(
  to: string,
  dedupeKey: string,
): string {
  return `email_${to}_${dedupeKey}`.replaceAll(':', '_');
}

type NotificationJobData = SendPushJobData | SendSmsJobData | SendEmailJobData;

@Injectable()
export class NotificationsQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationsQueueService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async onModuleInit() {
    const connection = redisConnectionFromUrl(
      this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6380',
    );
    this.queue = new Queue(NOTIFICATIONS_QUEUE_NAME, {
      connection,
      prefix: 'carservice',
    });

    if (!this.shouldStartWorker()) {
      return;
    }

    this.worker = new Worker(
      NOTIFICATIONS_QUEUE_NAME,
      async (job) => {
        if (job.name === NOTIFICATIONS_JOB_SEND_PUSH) {
          const data = job.data as SendPushJobData;
          if (!data?.userId || !data.title || !data.body) {
            return;
          }
          await this.notifications.processSendPush(data);
          return;
        }
        if (job.name === NOTIFICATIONS_JOB_SEND_SMS) {
          const data = job.data as SendSmsJobData;
          if (!data?.phone || !data.body) {
            return;
          }
          await this.notifications.processSendSms(data);
          return;
        }
        if (job.name === NOTIFICATIONS_JOB_SEND_EMAIL) {
          const data = job.data as SendEmailJobData;
          if (!data?.to || !data.subject || !data.html || !data.text) {
            return;
          }
          await this.notifications.processSendEmail(data);
        }
      },
      { connection, prefix: 'carservice' },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.warn(
        `Job notifications ${job?.name} ${job?.id} failed: ${error.message}`,
      );
    });
  }

  async enqueuePush(data: SendPushJobData) {
    return this.enqueue(
      NOTIFICATIONS_JOB_SEND_PUSH,
      data,
      notificationsPushJobId(
        data.userId,
        data.dedupeKey ?? this.fallbackDedupe(data.title, data.body),
      ),
      () => this.notifications.processSendPush(data),
    );
  }

  async enqueueSms(data: SendSmsJobData) {
    return this.enqueue(
      NOTIFICATIONS_JOB_SEND_SMS,
      data,
      notificationsSmsJobId(
        data.phone,
        data.dedupeKey ?? this.fallbackDedupe(data.phone, data.body),
      ),
      () => this.notifications.processSendSms(data),
    );
  }

  async enqueueEmail(data: SendEmailJobData) {
    return this.enqueue(
      NOTIFICATIONS_JOB_SEND_EMAIL,
      data,
      notificationsEmailJobId(
        data.to,
        data.dedupeKey ?? this.fallbackDedupe(data.to, data.subject),
      ),
      () => this.notifications.processSendEmail(data),
    );
  }

  /**
   * Enqueue les canaux du template booking (email / SMS).
   * Push métier = M09-S04.
   */
  async enqueueBookingTemplate(input: {
    templateId: BookingNotificationTemplateId;
    vars: BookingNotificationVars;
    emailTo?: string | null;
    smsTo?: string | null;
    dedupeKey: string;
  }) {
    const rendered = this.notifications.buildBookingNotification(
      input.templateId,
      input.vars,
    );
    const results: Array<{ channel: string; result: unknown }> = [];

    if (rendered.email && input.emailTo) {
      results.push({
        channel: 'email',
        result: await this.enqueueEmail({
          to: input.emailTo,
          subject: rendered.email.subject,
          html: rendered.email.html,
          text: rendered.email.text,
          dedupeKey: `${input.dedupeKey}_email`,
        }),
      });
    }

    if (rendered.sms && input.smsTo) {
      results.push({
        channel: 'sms',
        result: await this.enqueueSms({
          phone: input.smsTo,
          body: rendered.sms,
          dedupeKey: `${input.dedupeKey}_sms`,
        }),
      });
    }

    return { templateId: input.templateId, results };
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  private async enqueue<T>(
    name: string,
    data: NotificationJobData,
    jobId: string,
    inline: () => Promise<T>,
  ) {
    if (this.queue && this.shouldStartWorker()) {
      try {
        await this.addJob(name, data, jobId);
        return { queued: true as const };
      } catch (error) {
        if (this.isDuplicateJob(error)) {
          return { queued: true as const, duplicate: true as const };
        }
        this.logger.warn(
          `Enqueue ${name} failed, processing inline: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }
    }

    const result = await inline();
    return { queued: false as const, ...result };
  }

  private shouldStartWorker(): boolean {
    if (this.config.get<string>('NOTIFICATIONS_WORKER_ENABLED') === 'true') {
      return true;
    }
    if (this.config.get<string>('NOTIFICATIONS_WORKER_ENABLED') === 'false') {
      return false;
    }
    return this.config.get<string>('NODE_ENV') !== 'test';
  }

  private async addJob(
    name: string,
    data: NotificationJobData,
    jobId: string,
  ) {
    const retry: Pick<JobsOptions, 'attempts' | 'backoff' | 'removeOnComplete'> =
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      };
    await this.queue?.add(name, data, { ...retry, jobId });
  }

  private fallbackDedupe(a: string, b: string): string {
    return `${a}_${b}_${Date.now()}`.slice(0, 80);
  }

  private isDuplicateJob(error: unknown): boolean {
    return error instanceof Error && /already exists/i.test(error.message);
  }
}
