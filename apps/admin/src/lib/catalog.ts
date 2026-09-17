export function parseCentsFromEuroInput(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isFinite(cents)) {
    return null;
  }
  return cents;
}

export function euroInputFromCents(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function parsePositiveInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  if (value <= 0) {
    return null;
  }
  return value;
}

export function slugifyCatalogName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function isValidCatalogSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 1 && slug.length <= 100;
}

export const EMPTY_OFFER_FORM_SCHEMA = { fields: [] as unknown[] };
export const EMPTY_OFFER_CHECKLIST = { items: [] as unknown[] };
