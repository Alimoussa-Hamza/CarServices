import { EMPTY_KYC_DRAFT } from '../../lib/kyc-validation';
import { useKycDraftStore } from '../kyc-draft.store';

describe('kyc draft store', () => {
  beforeEach(() => {
    useKycDraftStore.getState().reset();
  });

  it('toggle formules sans prix', () => {
    useKycDraftStore.getState().toggleFormula('complet');
    expect(useKycDraftStore.getState().formulas).toEqual(['complet']);
    useKycDraftStore.getState().toggleFormula('complet');
    expect(useKycDraftStore.getState().formulas).toEqual([]);
  });

  it('reset ramène le brouillon vide', () => {
    useKycDraftStore.getState().patch({ companyName: 'x' });
    useKycDraftStore.getState().reset();
    expect(useKycDraftStore.getState().companyName).toBe(EMPTY_KYC_DRAFT.companyName);
  });
});
