import { formatDurationMinutes, formatPriceEur, formatSlotFr } from '../format';

describe('formatPriceEur', () => {
  it('formate en euros FR', () => {
    expect(formatPriceEur(3900)).toMatch(/39/);
    expect(formatPriceEur(3900)).toMatch(/€/);
  });
});

describe('formatDurationMinutes', () => {
  it('affiche minutes ou heures', () => {
    expect(formatDurationMinutes(45)).toBe('45 min');
    expect(formatDurationMinutes(120)).toBe('2 h');
    expect(formatDurationMinutes(75)).toBe('1 h 15');
  });
});

describe('formatSlotFr', () => {
  it('retourne une date lisible', () => {
    const label = formatSlotFr('2026-09-20T09:00:00.000Z');
    expect(label.length).toBeGreaterThan(5);
  });
});
