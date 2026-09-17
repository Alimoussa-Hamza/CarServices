import {
  isValidCatalogSlug,
  parseCentsFromEuroInput,
  parsePositiveInt,
  slugifyCatalogName,
} from './catalog';

export const VEHICLE_SURCHARGE_KEYS = [
  'citadine',
  'berline',
  'suv',
  'utilitaire',
  'moto',
] as const;

export type VehicleSurchargeKey = (typeof VEHICLE_SURCHARGE_KEYS)[number];

const VEHICLE_LABEL_FR: Record<VehicleSurchargeKey, string> = {
  citadine: 'Citadine',
  berline: 'Berline',
  suv: 'SUV',
  utilitaire: 'Utilitaire',
  moto: 'Moto',
};

export function vehicleSurchargeLabel(key: VehicleSurchargeKey): string {
  return VEHICLE_LABEL_FR[key];
}

export function parsePriceCoefficient(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 10) {
    return null;
  }
  return value;
}

export function parseLeadHours(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  if (value > 168) {
    return null;
  }
  return value;
}

/** Empty input = inherit catalog price (null override). */
export function parseOptionalCents(
  raw: string,
): { ok: true; cents: number | null } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: true, cents: null };
  }
  const cents = parseCentsFromEuroInput(trimmed);
  if (cents === null) {
    return { ok: false };
  }
  return { ok: true, cents };
}

export function parsePolygonJson(raw: string): Array<{ lat: number; lng: number }> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 3) {
      return null;
    }
    const points: Array<{ lat: number; lng: number }> = [];
    for (const item of parsed) {
      if (
        typeof item !== 'object' ||
        item === null ||
        typeof (item as { lat?: unknown }).lat !== 'number' ||
        typeof (item as { lng?: unknown }).lng !== 'number'
      ) {
        return null;
      }
      const lat = (item as { lat: number }).lat;
      const lng = (item as { lng: number }).lng;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return null;
      }
      points.push({ lat, lng });
    }
    return points;
  } catch {
    return null;
  }
}

export { isValidCatalogSlug, parsePositiveInt, slugifyCatalogName };
