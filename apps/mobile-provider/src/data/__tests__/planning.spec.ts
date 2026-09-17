import {
  chipActive,
  PLANNING_CHIPS,
  resetMockPlanning,
  slotsForDay,
  togglePlanningChip,
  weekDates,
} from '../planning';

describe('planning (mock)', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    resetMockPlanning();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  it('expose une semaine Lun–Dim, pas une grille mois', () => {
    const days = weekDates(new Date('2026-09-14T10:00:00'));
    expect(days.map((day) => day.label)).toEqual([
      'Lun',
      'Mar',
      'Mer',
      'Jeu',
      'Ven',
      'Sam',
      'Dim',
    ]);
    expect(days).toHaveLength(7);
  });

  it('active / désactive un chip sans tomber à zéro créneau', async () => {
    const current = {
      weeklySlots: [
        {
          id: 'b1111111-1111-4111-8111-111111111301',
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '12:00',
          isActive: true,
        },
      ],
      upcoming: [],
    };
    const chip = PLANNING_CHIPS[1];
    const added = await togglePlanningChip(current, 1, chip);
    expect(chipActive(added.weeklySlots, 1, chip)).toBe(true);
    expect(slotsForDay(added.weeklySlots, 1).length).toBeGreaterThan(1);

    const only = {
      weeklySlots: current.weeklySlots,
      upcoming: [],
    };
    const refused = await togglePlanningChip(only, 1, PLANNING_CHIPS[0]);
    expect(refused).toBe(only);
  });
});
