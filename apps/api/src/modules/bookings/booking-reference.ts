import { randomBytes } from 'crypto';

/** Référence unique `CS-YYYYMMDD-XXXX` (UTC). */
export function generateBookingReference(at: Date = new Date()): string {
  const ymd = at.toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `CS-${ymd}-${suffix}`;
}
