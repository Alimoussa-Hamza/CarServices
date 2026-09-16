import {
  deleteClientAccount,
  getClientProfile,
  resetMockProfileForTests,
  updateClientProfile,
} from '../profile';

describe('profile (mock)', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    resetMockProfileForTests();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  it('lit le profil mock', async () => {
    const profile = await getClientProfile();
    expect(profile.firstName).toBe('Ada');
    expect(profile.phone).toMatch(/^\+/);
  });

  it('met à jour le prénom', async () => {
    const updated = await updateClientProfile({ firstName: 'Claire' });
    expect(updated.firstName).toBe('Claire');
  });

  it('supprime le compte puis refuse un 2e delete', async () => {
    const res = await deleteClientAccount();
    expect(res.deleted).toBe(true);
    await expect(deleteClientAccount()).rejects.toMatchObject({
      code: 'ACCOUNT_ALREADY_DELETED',
    });
  });
});
