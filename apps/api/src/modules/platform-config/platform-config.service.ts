import { Injectable } from '@nestjs/common';
import {
  AdminPlatformConfig,
  AdminUpdatePlatformConfigDto,
  CANCEL_FREE_HOURS,
  CANCEL_LATE_HOURS,
  MATCHING_TIMEOUT_T1_MINUTES,
  MATCHING_TIMEOUT_T2_HOURS,
  MATCHING_UNASSIGNED_LEAD_HOURS,
  PLATFORM_COMMISSION_RATE,
} from '@carservice/shared-types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const PLATFORM_CONFIG_KEYS = {
  commissionRate: 'commission_rate',
  matchingTimeoutT1Minutes: 'matching_timeout_t1_minutes',
  matchingTimeoutT2Hours: 'matching_timeout_t2_hours',
  matchingUnassignedLeadHours: 'matching_unassigned_lead_hours',
  cancelFreeHours: 'cancel_free_hours',
  cancelLateHours: 'cancel_late_hours',
  serviceFeeCents: 'service_fee_cents',
} as const;

type ConfigField = keyof typeof PLATFORM_CONFIG_KEYS;

const DEFAULTS: Record<ConfigField, number> = {
  commissionRate: PLATFORM_COMMISSION_RATE,
  matchingTimeoutT1Minutes: MATCHING_TIMEOUT_T1_MINUTES,
  matchingTimeoutT2Hours: MATCHING_TIMEOUT_T2_HOURS,
  matchingUnassignedLeadHours: MATCHING_UNASSIGNED_LEAD_HOURS,
  cancelFreeHours: CANCEL_FREE_HOURS,
  cancelLateHours: CANCEL_LATE_HOURS,
  serviceFeeCents: 0,
};

@Injectable()
export class PlatformConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicConfig(): Promise<AdminPlatformConfig> {
    const rows = await this.prisma.platformConfig.findMany();
    const byKey = new Map(rows.map((row) => [row.key, row]));
    const latestUpdatedAt = rows.reduce<Date | null>((latest, row) => {
      if (!latest || row.updatedAt > latest) {
        return row.updatedAt;
      }
      return latest;
    }, null);

    const read = (field: ConfigField): number => {
      const row = byKey.get(PLATFORM_CONFIG_KEYS[field]);
      return asNumber(row?.value, DEFAULTS[field]);
    };

    return {
      commissionRate: read('commissionRate'),
      matchingTimeoutT1Minutes: read('matchingTimeoutT1Minutes'),
      matchingTimeoutT2Hours: read('matchingTimeoutT2Hours'),
      matchingUnassignedLeadHours: read('matchingUnassignedLeadHours'),
      cancelFreeHours: read('cancelFreeHours'),
      cancelLateHours: read('cancelLateHours'),
      serviceFeeCents: read('serviceFeeCents'),
      updatedAt: latestUpdatedAt ? latestUpdatedAt.toISOString() : null,
    };
  }

  async update(
    dto: AdminUpdatePlatformConfigDto,
  ): Promise<{ data: AdminPlatformConfig }> {
    const entries = Object.entries(dto).filter(
      ([, value]) => value !== undefined,
    ) as Array<[ConfigField, number]>;

    await this.prisma.$transaction(
      entries.map(([field, value]) =>
        this.prisma.platformConfig.upsert({
          where: { key: PLATFORM_CONFIG_KEYS[field] },
          create: {
            key: PLATFORM_CONFIG_KEYS[field],
            value: value as Prisma.InputJsonValue,
          },
          update: {
            value: value as Prisma.InputJsonValue,
          },
        }),
      ),
    );

    return { data: await this.getPublicConfig() };
  }

  async getCommissionRate(): Promise<number> {
    return (await this.getPublicConfig()).commissionRate;
  }

  async getMatchingTimeouts(): Promise<{
    t1Minutes: number;
    t2Hours: number;
    leadHours: number;
  }> {
    const config = await this.getPublicConfig();
    return {
      t1Minutes: config.matchingTimeoutT1Minutes,
      t2Hours: config.matchingTimeoutT2Hours,
      leadHours: config.matchingUnassignedLeadHours,
    };
  }
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}
