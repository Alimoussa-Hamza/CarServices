import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsOptions, Queue, Worker } from 'bullmq';
import { redisConnectionFromUrl } from '../bookings/matching-timeouts';
import { NotificationsService } from './notifications.service';
import type { SendPushJobData } from './notifications.service';

export const NOTIFICATIONS_QUEUE_NAME = 'notifications';
export const NOTIFICATIONS_JOB_SEND_PUSH = 'send-push';

export function notificationsPushJobId(
  userId: string,
  dedupeKey: string,
): string {
  return `push_${userId}_${dedupeKey}`.replaceAll(':', '_');
}

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
        const data = job.data as SendPushJobData | undefined;
        if (!data?.userId || !data.title || !data.body) {
          return;
        }
        await this.notifications.processSendPush(data);
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
    if (this.queue && this.shouldStartWorker()) {
      try {
        await this.addJob(data);
        return { queued: true as const };
      } catch (error) {
        if (this.isDuplicateJob(error)) {
          return { queued: true as const, duplicate: true as const };
        }
        this.logger.warn(
          `Enqueue push failed, processing inline: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }
    }

    const result = await this.notifications.processSendPush(data);
    return { queued: false as const, ...result };
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
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

  private async addJob(data: SendPushJobData) {
    const retry: Pick<JobsOptions, 'attempts' | 'backoff' | 'removeOnComplete'> =
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      };
    const dedupeKey =
      data.dedupeKey ??
      `${data.title}_${data.body}_${Date.now()}`.slice(0, 80);
    await this.queue?.add(NOTIFICATIONS_JOB_SEND_PUSH, data, {
      ...retry,
      jobId: notificationsPushJobId(data.userId, dedupeKey),
    });
  }

  private isDuplicateJob(error: unknown): boolean {
    return error instanceof Error && /already exists/i.test(error.message);
  }
}
