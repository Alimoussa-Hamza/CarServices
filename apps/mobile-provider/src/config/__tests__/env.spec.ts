import { parseUseMocks } from '../env';

describe('parseUseMocks', () => {
  it('fallback true par défaut', () => {
    expect(parseUseMocks(undefined)).toBe(true);
    expect(parseUseMocks('')).toBe(true);
  });

  it('accepte true / 1 / yes', () => {
    expect(parseUseMocks('true')).toBe(true);
    expect(parseUseMocks('1')).toBe(true);
    expect(parseUseMocks('YES')).toBe(true);
  });

  it('refuse false et autres', () => {
    expect(parseUseMocks('false')).toBe(false);
    expect(parseUseMocks('0')).toBe(false);
    expect(parseUseMocks('no')).toBe(false);
  });
});
