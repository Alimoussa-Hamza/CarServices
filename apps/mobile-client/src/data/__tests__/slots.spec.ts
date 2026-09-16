import { buildMockSlots } from '../slots';

describe('buildMockSlots', () => {
  it('génère 3 jours avec des créneaux', () => {
    const res = buildMockSlots(75);
    expect(res.days).toHaveLength(3);
    expect(res.days[0]?.slots.length).toBeGreaterThan(0);
    expect(res.horizonDays).toBe(14);
  });
});
