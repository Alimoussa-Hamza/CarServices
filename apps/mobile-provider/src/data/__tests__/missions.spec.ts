import { ApiError } from '@carservice/api-client';
import {
  acceptMission,
  canConfirmDecline,
  declineMission,
  fetchMissionBoard,
  fetchMissionDetail,
  MOCK_HIDDEN_STREET,
  MOCK_MISSION_OK_ID,
  MOCK_MISSION_TAKEN_ID,
  missionsForTab,
  resetMockMissions,
} from '../missions';

describe('missions repository (mock)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    resetMockMissions();
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

  it('détail avant accept : quartier, pas de rue', async () => {
    const detail = await fetchMissionDetail(MOCK_MISSION_OK_ID);
    expect(detail.netLabel).toBe('77,60 € net');
    expect(detail.street).toBeNull();
    expect(detail.quartier).not.toContain('rue');
  });

  it('accept débloque l’adresse, sans chrono', async () => {
    const accepted = await acceptMission(MOCK_MISSION_OK_ID);
    expect(accepted.street).toBe(MOCK_HIDDEN_STREET);
    const board = await fetchMissionBoard();
    expect(board.newMissions.find((item) => item.id === MOCK_MISSION_OK_ID)).toBeUndefined();
  });

  it('accept trop tard → déjà prise (API 409)', async () => {
    await expect(acceptMission(MOCK_MISSION_TAKEN_ID)).rejects.toMatchObject({
      code: 'BOOKING_ALREADY_ACCEPTED',
    });
    await expect(acceptMission(MOCK_MISSION_TAKEN_ID)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('refuse seulement avec un motif, puis retire de la liste', async () => {
    expect(canConfirmDecline(null)).toBe(false);
    expect(canConfirmDecline('slot')).toBe(true);
    await declineMission(MOCK_MISSION_OK_ID, 'Créneau horaire indisponible');
    const board = await fetchMissionBoard();
    expect(board.newMissions.find((item) => item.id === MOCK_MISSION_OK_ID)).toBeUndefined();
  });
});
