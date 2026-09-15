import { createHmac, timingSafeEqual } from 'crypto';

export const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;

export type ParsedStripeSignature = {
  timestamp: number;
  signatures: string[];
};

export function parseStripeSignatureHeader(
  header: string,
): ParsedStripeSignature | null {
  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of header.split(',')) {
    const separator = part.indexOf('=');
    if (separator <= 0) {
      continue;
    }
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key === 't') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        timestamp = parsed;
      }
    }
    if (key === 'v1' && value) {
      signatures.push(value);
    }
  }

  if (timestamp === null || signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
}

export function verifyStripeWebhookSignature(input: {
  payload: string;
  header: string;
  secret: string;
  now?: Date;
}): boolean {
  const parsed = parseStripeSignatureHeader(input.header);
  if (!parsed) {
    return false;
  }

  const nowSec = Math.floor((input.now ?? new Date()).getTime() / 1000);
  if (Math.abs(nowSec - parsed.timestamp) > STRIPE_SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const expected = createHmac('sha256', input.secret)
    .update(`${parsed.timestamp}.${input.payload}`, 'utf8')
    .digest('hex');

  return parsed.signatures.some((signature) => safeEqualHex(expected, signature));
}

function safeEqualHex(expected: string, actual: string): boolean {
  try {
    const left = Buffer.from(expected, 'hex');
    const right = Buffer.from(actual, 'hex');
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}
