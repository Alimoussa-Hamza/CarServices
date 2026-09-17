import {
  canContinueKycStep,
  canSubmitKyc,
  digitsOnly,
  EMPTY_KYC_DRAFT,
  formatSiretDisplay,
  isValidIsoDate,
  isValidSiret,
  parseKycStep,
  selectedWashMethods,
  toIsoDate,
  toSubmitKycDto,
  toWeeklySlots,
  type KycDraft,
} from '../kyc-validation';

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

describe('kyc-validation', () => {
  it('valide un SIRET à 14 chiffres', () => {
    expect(isValidSiret('812 345 678 00021')).toBe(true);
    expect(digitsOnly('812 345 678 00021')).toBe('81234567800021');
    expect(isValidSiret('123')).toBe(false);
  });

  it('refuse une RC Pro expirée', () => {
    expect(isValidIsoDate('2020-01-01')).toBe(false);
    expect(isValidIsoDate('2099-12-31')).toBe(true);
  });

  it('grise Continuer selon l’étape', () => {
    expect(canContinueKycStep(1, EMPTY_KYC_DRAFT)).toBe(false);
    expect(canContinueKycStep(1, validDraft)).toBe(true);
    expect(canContinueKycStep(3, { ...validDraft, waterless: false, steam: false })).toBe(
      false,
    );
    expect(canContinueKycStep(5, { ...validDraft, formulas: [] })).toBe(false);
    expect(canContinueKycStep(7, { ...validDraft, hasPortrait: false })).toBe(false);
  });

  it('construit le DTO submit (RC Pro + méthodes, pas de prix)', () => {
    const dto = toSubmitKycDto(validDraft);
    expect(dto.siret).toBe('81234567800021');
    expect(dto.washMethods).toEqual(['waterless']);
    expect(dto.documents[0]?.docType).toBe('rc_pro');
    expect(selectedWashMethods({ ...validDraft, steam: true })).toEqual([
      'waterless',
      'steam',
    ]);
  });

  it('génère des créneaux semaine sans calendrier mois', () => {
    const slots = toWeeklySlots(validDraft);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]).toMatchObject({ isActive: true, startTime: expect.any(String) });
  });

  it('clamp le jour de la roue (pas de grille mois)', () => {
    expect(toIsoDate(2027, 2, 31)).toBe('2027-02-28');
    expect(formatSiretDisplay('81234567800021')).toBe('812 345 678 00021');
    expect(parseKycStep('3')).toBe(3);
    expect(parseKycStep('9')).toBeNull();
  });

  it('autorise Envoyer seulement si les 7 étapes sont valides', () => {
    expect(canSubmitKyc(EMPTY_KYC_DRAFT)).toBe(false);
    expect(canSubmitKyc(validDraft)).toBe(true);
  });
});
