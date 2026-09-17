import { EMPTY_KYC_DRAFT, type KycDraft } from '../../lib/kyc-validation';
import {
  applyConnectSuccess,
  MOCK_STRIPE_ACCOUNT_ID,
  MOCK_STRIPE_ONBOARD_URL,
  startConnectOnboarding,
} from '../connect';
import { resetMockKycGate, setMockKycGate, submitKycDossier } from '../kyc';

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

describe('connect onboarding (mock)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    resetMockKycGate();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = originalEnv;
  });

  it('retourne un Account Link mock sans Skip', async () => {
    await expect(startConnectOnboarding()).resolves.toEqual({
      url: MOCK_STRIPE_ONBOARD_URL,
      stripeAccountId: MOCK_STRIPE_ACCOUNT_ID,
    });
  });

  it('n’active pas charges_enabled tant que KYC n’est pas approved', async () => {
    await submitKycDossier(validDraft);
    await expect(applyConnectSuccess()).resolves.toMatchObject({
      kycStatus: 'submitted',
      chargesEnabled: false,
    });
  });

  it('après KYC approved, le retour Stripe ouvre les missions', async () => {
    setMockKycGate({
      kycStatus: 'approved',
      chargesEnabled: false,
      rejectionReason: null,
    });
    await expect(applyConnectSuccess()).resolves.toEqual({
      kycStatus: 'approved',
      chargesEnabled: true,
      rejectionReason: null,
    });
  });
});
