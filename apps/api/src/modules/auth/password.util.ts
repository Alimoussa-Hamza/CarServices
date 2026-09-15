import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCb);
const KEYLEN = 64;

/** Hash stocké : `scrypt$<salt_b64url>$<key_b64url>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt}$${derived.toString('base64url')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [algo, salt, hash] = stored.split('$');
  if (algo !== 'scrypt' || !salt || !hash) {
    return false;
  }

  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  const expected = Buffer.from(hash, 'base64url');
  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}

/** Hash factice pour égaliser le timing si l’utilisateur n’existe pas. */
export const DUMMY_PASSWORD_HASH =
  'scrypt$AAAAAAAAAAAAAAAAAAAAAA$5-a21B7NnlPg3gH4T1bLPU8YB_PpiTWSnoa8D-3SPsMxMmXVWG0uSSR92WWNPTN9SUjLacjgdcYhNWtha7lbcw';
