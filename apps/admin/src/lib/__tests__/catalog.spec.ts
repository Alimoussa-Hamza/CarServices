import {
  isValidCatalogSlug,
  parseCentsFromEuroInput,
  parsePositiveInt,
  slugifyCatalogName,
} from '../catalog';

describe('parseCentsFromEuroInput', () => {
  it('parses comma decimals', () => {
    expect(parseCentsFromEuroInput('49,90')).toBe(4990);
  });

  it('rejects junk', () => {
    expect(parseCentsFromEuroInput('abc')).toBeNull();
  });
});

describe('parsePositiveInt', () => {
  it('parses duration', () => {
    expect(parsePositiveInt('90')).toBe(90);
  });

  it('rejects zero', () => {
    expect(parsePositiveInt('0')).toBeNull();
  });
});

describe('slugifyCatalogName', () => {
  it('builds kebab-case without accents', () => {
    expect(slugifyCatalogName('Lavage Premium')).toBe('lavage-premium');
  });
});

describe('isValidCatalogSlug', () => {
  it('accepts kebab slug', () => {
    expect(isValidCatalogSlug('wash-premium')).toBe(true);
  });

  it('rejects spaces', () => {
    expect(isValidCatalogSlug('wash premium')).toBe(false);
  });
});
