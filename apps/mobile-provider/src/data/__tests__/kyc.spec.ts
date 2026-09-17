import { ApiError } from '@carservice/api-client';
import { EMPTY_KYC_DRAFT, type KycDraft } from '../../lib/kyc-validation';
import {
  fetchKycGate,
  fetchRcProAlert,
  refreshKycStatus,
  resetMockKycGate,
  setMockKycGate,
  submitKycDossier,
} from '../kyc';

const validDraft: KycDraft = {
  ...EMPTY_KYC_DRAFT,
  companyName: 'Marc Dubois AE',
  siret: '81234567800021',
  rcSelected: true,
  rcExpiresAt: '2099-12-31',
  waterless: true,
  zoneAddress: '12 rue de la République, 69002 Lyon',
  formulas: ['complet'],
  hasPortrait: true,
};

describe('kyc repository (mock)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    resetMockKycGate();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = originalEnv;
  });

  it('un nouveau mock n’est pas eligible missions', async () => {
    await expect(fetchKycGate()).resolves.toEqual({
      kycStatus: 'draft',
      chargesEnabled: false,
      rejectionReason: null,
    });
  });

  it('refuse un dossier incomplet', async () => {
    await expect(submitKycDossier(EMPTY_KYC_DRAFT)).rejects.toBeInstanceOf(ApiError);
  });

  it('submit mock passe en submitted et reste pending au refetch', async () => {
    await expect(submitKycDossier(validDraft)).resolves.toMatchObject({
      kycStatus: 'submitted',
      chargesEnabled: false,
    });
    await expect(fetchKycGate()).resolves.toMatchObject({ kycStatus: 'submitted' });
  });

  it('conserve un refus mock pour l’écran rejected', async () => {
    setMockKycGate({
      kycStatus: 'rejected',
      chargesEnabled: false,
      rejectionReason: 'Document RC Pro illisible',
    });
    await expect(fetchKycGate()).resolves.toMatchObject({
      kycStatus: 'rejected',
      rejectionReason: 'Document RC Pro illisible',
    });
  });

  it('Actualiser mock (revue admin) → approved sans charges', async () => {
    await submitKycDossier(validDraft);
    await expect(refreshKycStatus()).resolves.toEqual({
      kycStatus: 'approved',
      chargesEnabled: false,
      rejectionReason: null,
    });
  });

  it('badge RC Pro J-30 depuis /providers/kyc/alerts (mock)', async () => {
    await expect(fetchRcProAlert()).resolves.toEqual({
      kind: 'expiring_soon',
      daysRemaining: 30,
    });
  });
});
