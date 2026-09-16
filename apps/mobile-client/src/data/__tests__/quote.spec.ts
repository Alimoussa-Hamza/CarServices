import { buildMockQuote } from '../quote';

describe('buildMockQuote', () => {
  it('additionne base + options + serviceFee depuis fixtures', () => {
    const quote = buildMockQuote({
      offerId: 'a1111111-1111-4111-8111-111111111102',
      optionIds: ['b1111111-1111-4111-8111-111111111202'],
    });
    expect(quote.breakdown.base).toBe(3900);
    expect(quote.breakdown.options).toHaveLength(1);
    expect(quote.breakdown.totalCents).toBe(3900 + 500 + 200);
    expect(quote.durationMinutes).toBe(75 + 15);
  });

  it('sans options garde le prix de base + fee', () => {
    const quote = buildMockQuote({
      offerId: 'a1111111-1111-4111-8111-111111111101',
      optionIds: [],
    });
    expect(quote.breakdown.totalCents).toBe(2900 + 200);
  });
});
