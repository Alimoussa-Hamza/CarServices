import { fetchKycGate } from '../kyc';

describe('fetchKycGate (mock)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = originalEnv;
  });

  it('un nouveau mock n’est pas eligible missions', async () => {
    await expect(fetchKycGate()).resolves.toEqual({
      kycStatus: 'draft',
      chargesEnabled: false,
    });
  });
});
