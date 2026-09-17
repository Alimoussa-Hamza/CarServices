import {
  parseLeadHours,
  parseOptionalCents,
  parsePolygonJson,
  parsePriceCoefficient,
  vehicleSurchargeLabel,
} from '../zones';

describe('parsePriceCoefficient', () => {
  it('parses 1,10', () => {
    expect(parsePriceCoefficient('1,10')).toBe(1.1);
  });

  it('rejects zero', () => {
    expect(parsePriceCoefficient('0')).toBeNull();
  });
});

describe('parseLeadHours', () => {
  it('allows zero', () => {
    expect(parseLeadHours('0')).toBe(0);
  });

  it('rejects above 168', () => {
    expect(parseLeadHours('200')).toBeNull();
  });
});

describe('parseOptionalCents', () => {
  it('treats blank as inherit', () => {
    expect(parseOptionalCents('')).toEqual({ ok: true, cents: null });
  });

  it('parses euros', () => {
    expect(parseOptionalCents('90')).toEqual({ ok: true, cents: 9000 });
  });

  it('rejects junk', () => {
    expect(parseOptionalCents('x')).toEqual({ ok: false });
  });
});

describe('parsePolygonJson', () => {
  it('requires three points', () => {
    expect(
      parsePolygonJson(
        '[{"lat":45.7,"lng":4.8},{"lat":45.8,"lng":4.8},{"lat":45.8,"lng":4.9}]',
      ),
    ).toHaveLength(3);
  });

  it('rejects invalid json', () => {
    expect(parsePolygonJson('not-json')).toBeNull();
  });
});

describe('vehicleSurchargeLabel', () => {
  it('maps berline', () => {
    expect(vehicleSurchargeLabel('berline')).toBe('Berline');
  });
});
