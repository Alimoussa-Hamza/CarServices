import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from '../password.util';

describe('password.util', () => {
  it('hash puis vérifie un mot de passe', async () => {
    const hash = await hashPassword('Secret123!');
    expect(hash.startsWith('scrypt$')).toBe(true);
    await expect(verifyPassword('Secret123!', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-pass', hash)).resolves.toBe(false);
  });

  it('rejette un hash mal formé', async () => {
    await expect(verifyPassword('Secret123!', 'not-a-hash')).resolves.toBe(
      false,
    );
  });

  it('expose un dummy hash scrypt valide', async () => {
    const parts = DUMMY_PASSWORD_HASH.split('$');
    expect(parts[0]).toBe('scrypt');
    expect(parts).toHaveLength(3);
    await expect(
      verifyPassword('dummy-password-not-used', DUMMY_PASSWORD_HASH),
    ).resolves.toBe(true);
  });
});
