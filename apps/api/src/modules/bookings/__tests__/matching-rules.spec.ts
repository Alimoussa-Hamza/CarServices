import {
  computeMatchingScore,
  haversineKm,
  isRcProValid,
  minutesFromUtc,
  rangesOverlap,
  slotFitsWeeklyAvailability,
} from '../matching-rules';

describe('matching-rules', () => {
  it('calcule une distance Lyon intra-muros < 5 km', () => {
    const km = haversineKm(45.764, 4.835, 45.75, 4.85);
    expect(km).toBeGreaterThan(1);
    expect(km).toBeLessThan(5);
  });

  it('score RG-MATCH-02 : plus proche et mieux noté gagne', () => {
    const close = computeMatchingScore({
      distanceKm: 2,
      rating: 4.8,
      acceptanceRate: 95,
    });
    const far = computeMatchingScore({
      distanceKm: 12,
      rating: 4.8,
      acceptanceRate: 95,
    });
    const late = computeMatchingScore({
      distanceKm: 2,
      rating: 4.8,
      acceptanceRate: 95,
      lateCount: 3,
      cancelCount: 1,
    });

    expect(close).toBeGreaterThan(far);
    expect(close).toBeGreaterThan(late);
  });

  it('normalise le taux d’acceptation 0–100', () => {
    expect(
      computeMatchingScore({
        distanceKm: 0,
        rating: 0,
        acceptanceRate: 100,
      }),
    ).toBe(15);
  });

  it('valide la RC Pro jusqu’à la fin du jour UTC', () => {
    const expiresAt = new Date('2026-09-13T00:00:00.000Z');
    expect(isRcProValid(expiresAt, new Date('2026-09-13T23:00:00.000Z'))).toBe(
      true,
    );
    expect(isRcProValid(expiresAt, new Date('2026-09-14T00:00:00.000Z'))).toBe(
      false,
    );
    expect(isRcProValid(null, new Date('2026-09-13T10:00:00.000Z'))).toBe(false);
  });

  it('minutes UTC depuis un Time Prisma', () => {
    expect(minutesFromUtc(new Date('1970-01-01T09:00:00.000Z'))).toBe(540);
  });

  it('détecte un chevauchement de créneaux', () => {
    expect(
      rangesOverlap(
        new Date('2026-09-13T14:00:00.000Z'),
        new Date('2026-09-13T15:45:00.000Z'),
        new Date('2026-09-13T15:00:00.000Z'),
        new Date('2026-09-13T16:00:00.000Z'),
      ),
    ).toBe(true);
    expect(
      rangesOverlap(
        new Date('2026-09-13T14:00:00.000Z'),
        new Date('2026-09-13T15:45:00.000Z'),
        new Date('2026-09-13T16:00:00.000Z'),
        new Date('2026-09-13T17:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('accepte un slot dans une plage hebdo active (dimanche UTC = 0)', () => {
    const weekly = [
      {
        dayOfWeek: 0,
        startTime: new Date('1970-01-01T08:00:00.000Z'),
        endTime: new Date('1970-01-01T18:00:00.000Z'),
        isActive: true,
      },
    ];

    expect(
      slotFitsWeeklyAvailability(
        new Date('2026-09-13T14:00:00.000Z'),
        new Date('2026-09-13T15:45:00.000Z'),
        weekly,
      ),
    ).toBe(true);
    expect(
      slotFitsWeeklyAvailability(
        new Date('2026-09-13T19:00:00.000Z'),
        new Date('2026-09-13T20:00:00.000Z'),
        weekly,
      ),
    ).toBe(false);
  });
});
