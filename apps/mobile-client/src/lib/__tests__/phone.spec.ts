import { isValidFrMobile, normalizeFrPhone } from '../phone';

describe('normalizeFrPhone', () => {
  it('convertit 06… en +336…', () => {
    expect(normalizeFrPhone('06 12 34 56 78')).toBe('+33612345678');
    expect(normalizeFrPhone('0612345678')).toBe('+33612345678');
  });

  it('conserve un +33 déjà normalisé', () => {
    expect(normalizeFrPhone('+33612345678')).toBe('+33612345678');
  });
});

describe('isValidFrMobile', () => {
  it('accepte 06/07', () => {
    expect(isValidFrMobile('0612345678')).toBe(true);
    expect(isValidFrMobile('0712345678')).toBe(true);
  });

  it('refuse fixe et trop court', () => {
    expect(isValidFrMobile('0112345678')).toBe(false);
    expect(isValidFrMobile('061234')).toBe(false);
  });
});
