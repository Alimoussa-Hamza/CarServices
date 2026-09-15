import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsOptions, Queue, Worker } from 'bullmq';
import { BookingMatchingService } from './booking-matching.service';
import {
  computeMatchingJobDelays,
  redisConnectionFromUrl,
} from './matching-timeouts';
import { PlatformConfigService } from '../platform-config/platform-config.service';

export const MATCHING_QUEUE_NAME = 'matching';
export const MATCHING_JOB_EXPAND = 'expand-radius';
export const MATCHING_JOB_UNASSIGNED = 'timeout-unassigned';

export function matchingJobId(name: string, bookingId: string): string {
  return `${name}_${bookingId}`;
}

@Injectable()
export class MatchingQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchingQueueService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly matchingService: BookingMatchingService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  async onModuleInit() {
    const connection = redisConnectionFromUrl(
      this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6380',
    );
    this.queue = new Queue(MATCHING_QUEUE_NAME, {
      connection,
      prefix: 'carservice',
    });

    if (!this.shouldStartWorker()) {
      return;
    }

    this.worker = new Worker(
      MATCHING_QUEUE_NAME,
      async (job) => {
        const bookingId = String(job.data?.bookingId ?? '');
        if (!bookingId) {
          return;
        }
        if (job.name === MATCHING_JOB_EXPAND) {
          await this.matchingService.expandRadius(bookingId);
          return;
        }
        if (job.name === MATCHING_JOB_UNASSIGNED) {
          await this.matchingService.timeoutUnassigned(bookingId);
        }
      },
      { connection, prefix: 'carservice' },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.warn(
        `Job matching ${job?.name} ${job?.id} failed: ${error.message}`,
      );
    });
  }

  async scheduleTimeouts(
    bookingId: string,
    slotStart: Date,
    now = new Date(),
  ) {
    if (!this.queue) {
      return;
    }

    const timeouts = await this.platformConfig.getMatchingTimeouts();
    const delays = computeMatchingJobDelays(now, slotStart, {
      t1Minutes: this.numberConfig(
        'MATCHING_TIMEOUT_T1_MINUTES',
        timeouts.t1Minutes,
      ),
      t2Hours: this.numberConfig(
        'MATCHING_TIMEOUT_T2_HOURS',
        timeouts.t2Hours,
      ),
      leadHours: this.numberConfig(
        'MATCHING_UNASSIGNED_LEAD_HOURS',
        timeouts.leadHours,
      ),
    });

    const retry: Pick<JobsOptions, 'attempts' | 'backoff' | 'removeOnComplete'> =
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      };

    if (delays.t1Ms < delays.t2Ms) {
      await this.addJob(MATCHING_JOB_EXPAND, bookingId, {
        ...retry,
        delay: delays.t1Ms,
      });
    }

    await this.addJob(MATCHING_JOB_UNASSIGNED, bookingId, {
      ...retry,
      delay: delays.t2Ms,
    });
  }

  async getJob(jobId: string) {
    return this.queue?.getJob(jobId) ?? null;
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  private shouldStartWorker(): boolean {
    if (this.config.get<string>('MATCHING_WORKER_ENABLED') === 'true') {
      return true;
    }
    if (this.config.get<string>('MATCHING_WORKER_ENABLED') === 'false') {
      return false;
    }
    return this.config.get<string>('NODE_ENV') !== 'test';
  }

  private async addJob(
    name: string,
    bookingId: string,
    opts: JobsOptions,
  ) {
    try {
      await this.queue?.add(name, { bookingId }, { ...opts, jobId: matchingJobId(name, bookingId) });
    } catch (error) {
      if (this.isDuplicateJob(error)) {
        return;
      }
      throw error;
    }
  }

  private isDuplicateJob(error: unknown): boolean {
    return error instanceof Error && /already exists/i.test(error.message);
  }

  private numberConfig(key: string, fallback: number): number {
    const parsed = Number(this.config.get<string>(key));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
