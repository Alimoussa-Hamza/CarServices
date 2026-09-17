import type {
  AdminPlatformConfig,
  AdminUpdatePlatformConfigDto,
} from '@carservice/shared-types';
import { euroInputFromCents, parseCentsFromEuroInput } from './catalog';

export type SettingsFormValues = {
  commissionPercent: string;
  matchingTimeoutT1Minutes: string;
  matchingTimeoutT2Hours: string;
  matchingUnassignedLeadHours: string;
  cancelFreeHours: string;
  cancelLateHours: string;
  serviceFeeEuros: string;
};

export function formatCommissionPercent(rate: number): string {
  const percent = Math.round(rate * 10000) / 100;
  return String(percent).replace('.', ',');
}

export function parseCommissionPercent(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const rate = Number(normalized) / 100;
  if (!Number.isFinite(rate) || rate <= 0 || rate >= 1) {
    return null;
  }
  return Math.round(rate * 10000) / 10000;
}

export function parseBoundedInt(
  raw: string,
  min: number,
  max: number,
): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  if (value < min || value > max) {
    return null;
  }
  return value;
}

export function parseServiceFeeCents(raw: string): number | null {
  const cents = parseCentsFromEuroInput(raw);
  if (cents === null || cents > 10_000) {
    return null;
  }
  return cents;
}

export function formValuesFromConfig(
  config: AdminPlatformConfig,
): SettingsFormValues {
  return {
    commissionPercent: formatCommissionPercent(config.commissionRate),
    matchingTimeoutT1Minutes: String(config.matchingTimeoutT1Minutes),
    matchingTimeoutT2Hours: String(config.matchingTimeoutT2Hours),
    matchingUnassignedLeadHours: String(config.matchingUnassignedLeadHours),
    cancelFreeHours: String(config.cancelFreeHours),
    cancelLateHours: String(config.cancelLateHours),
    serviceFeeEuros: euroInputFromCents(config.serviceFeeCents),
  };
}

export function parseSettingsForm(
  values: SettingsFormValues,
): Omit<AdminPlatformConfig, 'updatedAt'> | null {
  const commissionRate = parseCommissionPercent(values.commissionPercent);
  const matchingTimeoutT1Minutes = parseBoundedInt(
    values.matchingTimeoutT1Minutes,
    1,
    240,
  );
  const matchingTimeoutT2Hours = parseBoundedInt(
    values.matchingTimeoutT2Hours,
    1,
    48,
  );
  const matchingUnassignedLeadHours = parseBoundedInt(
    values.matchingUnassignedLeadHours,
    1,
    24,
  );
  const cancelFreeHours = parseBoundedInt(values.cancelFreeHours, 1, 168);
  const cancelLateHours = parseBoundedInt(values.cancelLateHours, 1, 48);
  const serviceFeeCents = parseServiceFeeCents(values.serviceFeeEuros);

  if (
    commissionRate === null ||
    matchingTimeoutT1Minutes === null ||
    matchingTimeoutT2Hours === null ||
    matchingUnassignedLeadHours === null ||
    cancelFreeHours === null ||
    cancelLateHours === null ||
    serviceFeeCents === null
  ) {
    return null;
  }

  return {
    commissionRate,
    matchingTimeoutT1Minutes,
    matchingTimeoutT2Hours,
    matchingUnassignedLeadHours,
    cancelFreeHours,
    cancelLateHours,
    serviceFeeCents,
  };
}

export function diffConfigPatch(
  current: AdminPlatformConfig,
  next: Omit<AdminPlatformConfig, 'updatedAt'>,
): AdminUpdatePlatformConfigDto | null {
  const dto: AdminUpdatePlatformConfigDto = {};
  if (next.commissionRate !== current.commissionRate) {
    dto.commissionRate = next.commissionRate;
  }
  if (next.matchingTimeoutT1Minutes !== current.matchingTimeoutT1Minutes) {
    dto.matchingTimeoutT1Minutes = next.matchingTimeoutT1Minutes;
  }
  if (next.matchingTimeoutT2Hours !== current.matchingTimeoutT2Hours) {
    dto.matchingTimeoutT2Hours = next.matchingTimeoutT2Hours;
  }
  if (next.matchingUnassignedLeadHours !== current.matchingUnassignedLeadHours) {
    dto.matchingUnassignedLeadHours = next.matchingUnassignedLeadHours;
  }
  if (next.cancelFreeHours !== current.cancelFreeHours) {
    dto.cancelFreeHours = next.cancelFreeHours;
  }
  if (next.cancelLateHours !== current.cancelLateHours) {
    dto.cancelLateHours = next.cancelLateHours;
  }
  if (next.serviceFeeCents !== current.serviceFeeCents) {
    dto.serviceFeeCents = next.serviceFeeCents;
  }
  if (Object.keys(dto).length === 0) {
    return null;
  }
  return dto;
}
