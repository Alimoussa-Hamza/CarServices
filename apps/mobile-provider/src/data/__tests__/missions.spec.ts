import { fetchMissionBoard, missionsForTab } from '../missions';

describe('missions repository (mock)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = originalEnv;
  });

  it('Nouvelles : quartier zone, net, pas de rue', async () => {
    const board = await fetchMissionBoard();
    expect(board.newMissions.length).toBeGreaterThan(0);
    const card = board.newMissions[0];
    expect(card?.quartier).toBe('Lyon 3e — Part-Dieu');
    expect(card?.quartier.includes('rue')).toBe(false);
    expect(card?.netLabel).toBe('77,60 € net');
    expect(missionsForTab(board, 'upcoming')).toEqual([]);
    expect(missionsForTab(board, 'active')).toEqual([]);
  });

  it('À venir / En cours vides en mock', async () => {
    const board = await fetchMissionBoard();
    expect(board.upcoming).toEqual([]);
    expect(board.active).toEqual([]);
  });
});
