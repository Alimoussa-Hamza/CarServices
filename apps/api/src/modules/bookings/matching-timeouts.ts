import {
  MATCHING_TIMEOUT_T1_MINUTES,
  MATCHING_TIMEOUT_T2_HOURS,
  MATCHING_UNASSIGNED_LEAD_HOURS,
} from '@carservice/shared-types';

export type MatchingTimeoutConfig = {
  t1Minutes?: number;
  t2Hours?: number;
  leadHours?: number;
};

export type MatchingJobDelays = {
  t1Ms: number;
  t2Ms: number;
};

/** Délais T1/T2 : T2 = min(broadcast+T2, H-lead du créneau) (RG-MATCH-04/05). */
export function computeMatchingJobDelays(
  now: Date,
  slotStart: Date,
  config: MatchingTimeoutConfig = {},
): MatchingJobDelays {
  const t1Minutes = positive(config.t1Minutes, MATCHING_TIMEOUT_T1_MINUTES);
  const t2Hours = positive(config.t2Hours, MATCHING_TIMEOUT_T2_HOURS);
  const leadHours = positive(config.leadHours, MATCHING_UNASSIGNED_LEAD_HOURS);

  const t1Ms = t1Minutes * 60 * 1000;
  const t2FromBroadcast = t2Hours * 60 * 60 * 1000;
  const t2FromSlotLead =
    slotStart.getTime() - leadHours * 60 * 60 * 1000 - now.getTime();

  return {
    t1Ms,
    t2Ms: Math.max(0, Math.min(t2FromBroadcast, t2FromSlotLead)),
  };
}

export function redisConnectionFromUrl(url: string): {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: null;
} {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    password: parsed.password || undefined,
    maxRetriesPerRequest: null,
  };
}

function positive(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && (value as number) > 0 ? (value as number) : fallback;
}
