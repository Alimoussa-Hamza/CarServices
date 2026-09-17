import {
  formatBookingStatusFr,
  formatDelayMinutes,
  formatEurFromCents,
  formatPercent,
  gmvBarHeights,
  sumBookingCounts,
} from '../format';

describe('formatEurFromCents', () => {
  it('formats cents as euro', () => {
    expect(formatEurFromCents(11200)).toMatch(/112/);
    expect(formatEurFromCents(0)).toMatch(/0/);
  });
});

describe('formatPercent', () => {
  it('uses a French decimal comma', () => {
    expect(formatPercent(92.5)).toBe('92,5 %');
  });
});

describe('formatDelayMinutes', () => {
  it('shows em dash when null', () => {
    expect(formatDelayMinutes(null)).toBe('—');
  });

  it('rounds one decimal', () => {
    expect(formatDelayMinutes(18.54)).toBe('18,5 min');
  });
});

describe('formatBookingStatusFr', () => {
  it('maps matching status', () => {
    expect(formatBookingStatusFr('pending_provider')).toBe('En matching');
  });
});

describe('sumBookingCounts', () => {
  it('sums all status counts', () => {
    expect(
      sumBookingCounts([
        { count: 3 },
        { count: 1 },
        { count: 0 },
      ]),
    ).toBe(4);
  });
});

describe('gmvBarHeights', () => {
  it('keeps a 2px floor when all zeros', () => {
    expect(gmvBarHeights([0, 0, 0], 80)).toEqual([2, 2, 2]);
  });

  it('scales to max height', () => {
    expect(gmvBarHeights([0, 50, 100], 80)).toEqual([2, 40, 80]);
  });
});
