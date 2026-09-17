import { isValidFrMobile, normalizeFrPhone } from '../phone';

describe('normalizeFrPhone', () => {
  it('convertit 06… en +336…', () => {
    expect(normalizeFrPhone('06 12 34 56 78')).toBe('+33612345678');
  });
});

describe('isValidFrMobile', () => {
  it('accepte 06/07 et refuse fixe', () => {
    expect(isValidFrMobile('0612345678')).toBe(true);
    expect(isValidFrMobile('0112345678')).toBe(false);
  });
});
