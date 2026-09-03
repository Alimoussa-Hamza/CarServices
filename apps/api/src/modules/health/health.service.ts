import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  check() {
    return {
      data: {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
      },
      meta: { requestId: crypto.randomUUID() },
    };
  }

  async ready() {
    let db = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }

    return {
      data: {
        status: db === 'ok' ? 'ready' : 'degraded',
        checks: { database: db },
        timestamp: new Date().toISOString(),
      },
      meta: { requestId: crypto.randomUUID() },
    };
  }
}
