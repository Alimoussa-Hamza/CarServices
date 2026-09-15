import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StripeWebhookEvent } from '@carservice/shared-types';
import { JobsOptions, Queue, Worker } from 'bullmq';
import { redisConnectionFromUrl } from '../bookings/matching-timeouts';
import { PaymentsService } from './payments.service';

export const PAYMENTS_QUEUE_NAME = 'payments';
export const PAYMENTS_JOB_WEBHOOK = 'process-stripe-webhook';

export function paymentsWebhookJobId(eventId: string): string {
  return `webhook_${eventId.replaceAll(':', '_')}`;
}

@Injectable()
export class PaymentsQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentsQueueService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly payments: PaymentsService,
  ) {}

  async onModuleInit() {
    const connection = redisConnectionFromUrl(
      this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6380',
    );
    this.queue = new Queue(PAYMENTS_QUEUE_NAME, {
      connection,
      prefix: 'carservice',
    });

    if (!this.shouldStartWorker()) {
      return;
    }

    this.worker = new Worker(
      PAYMENTS_QUEUE_NAME,
      async (job) => {
        const event = job.data?.event as StripeWebhookEvent | undefined;
        if (!event?.id || !event.type) {
          return;
        }
        await this.payments.processStripeEvent(event);
      },
      { connection, prefix: 'carservice' },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.warn(
        `Job payments ${job?.name} ${job?.id} failed: ${error.message}`,
      );
    });
  }

  async ingest(event: StripeWebhookEvent) {
    if (this.queue && this.shouldStartWorker()) {
      try {
        await this.addJob(event);
        return { received: true as const };
      } catch (error) {
        if (this.isDuplicateJob(error)) {
          return { received: true as const, duplicate: true as const };
        }
        this.logger.warn(
          `Enqueue webhook ${event.id} failed, processing inline: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }
    }

    const result = await this.payments.processStripeEvent(event);
    return { received: true as const, duplicate: result.duplicate };
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  private shouldStartWorker(): boolean {
    if (this.config.get<string>('PAYMENTS_WORKER_ENABLED') === 'true') {
      return true;
    }
    if (this.config.get<string>('PAYMENTS_WORKER_ENABLED') === 'false') {
      return false;
    }
    return this.config.get<string>('NODE_ENV') !== 'test';
  }

  private async addJob(event: StripeWebhookEvent) {
    const retry: Pick<JobsOptions, 'attempts' | 'backoff' | 'removeOnComplete'> =
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      };
    await this.queue?.add(
      PAYMENTS_JOB_WEBHOOK,
      { event },
      { ...retry, jobId: paymentsWebhookJobId(event.id) },
    );
  }

  private isDuplicateJob(error: unknown): boolean {
    return error instanceof Error && /already exists/i.test(error.message);
  }
}
