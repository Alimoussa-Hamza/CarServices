import { ApiError } from '@carservice/api-client';
import {
  acceptMission,
  addExecutionPhoto,
  canCompleteExecution,
  canConfirmCancel,
  canConfirmDecline,
  cancelAssignedMission,
  completeMission,
  declineMission,
  fetchExecution,
  fetchMissionBoard,
  fetchMissionDetail,
  markArrived,
  missionOpenHref,
  MOCK_CLIENT_PHONE,
  MOCK_HIDDEN_STREET,
  MOCK_MISSION_LAT,
  MOCK_MISSION_OK_ID,
  MOCK_MISSION_TAKEN_ID,
  missionsForTab,
  resetMockMissions,
  startEnRoute,
  toggleChecklistItem,
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

  it('après accept : À venir, rue + tel, pas de saut vers arrivé', async () => {
    await acceptMission(MOCK_MISSION_OK_ID);
    const board = await fetchMissionBoard();
    expect(board.upcoming.map((item) => item.id)).toEqual([MOCK_MISSION_OK_ID]);
    const detail = await fetchMissionDetail(MOCK_MISSION_OK_ID);
    expect(detail.street).toBe(MOCK_HIDDEN_STREET);
    expect(detail.clientPhone).toBe(MOCK_CLIENT_PHONE);
    expect(detail.lat).toBe(MOCK_MISSION_LAT);
    await expect(markArrived(MOCK_MISSION_OK_ID)).rejects.toMatchObject({
      code: 'BOOKING_INVALID_TRANSITION',
    });
  });

  it('en route puis arrivé, sans coords géofence côté mobile', async () => {
    await acceptMission(MOCK_MISSION_OK_ID);
    const enRoute = await startEnRoute(MOCK_MISSION_OK_ID);
    expect(enRoute.status).toBe('en_route');
    const board = await fetchMissionBoard();
    expect(board.active[0]?.id).toBe(MOCK_MISSION_OK_ID);
    expect(board.active[0]?.inProgress).toBe(false);
    const arrived = await markArrived(MOCK_MISSION_OK_ID);
    expect(arrived.status).toBe('in_progress');
    expect(arrived.inProgress).toBe(true);
  });

  it('annuler exige un motif, puis retire la mission assignée', async () => {
    expect(canConfirmCancel(null)).toBe(false);
    expect(canConfirmCancel('personal')).toBe(true);
    await acceptMission(MOCK_MISSION_OK_ID);
    await expect(cancelAssignedMission(MOCK_MISSION_OK_ID, 'ab')).rejects.toMatchObject({
      code: 'BOOKING_CANCEL_REASON_REQUIRED',
    });
    await cancelAssignedMission(MOCK_MISSION_OK_ID, 'Empêchement personnel');
    const board = await fetchMissionBoard();
    expect(board.upcoming).toEqual([]);
    expect(board.active).toEqual([]);
  });

  it('ouvre le détail P03 pour une nouvelle, P04 après accept', () => {
    const card = {
      id: MOCK_MISSION_OK_ID,
      offerName: 'Complet',
      quartier: 'Lyon 3e — Part-Dieu',
      netLabel: '77,60 € net',
      slotLabel: "Aujourd'hui, 14h00",
      durationLabel: '60 min',
      inProgress: false,
    };
    expect(missionOpenHref(card, 'new')).toBe(`/missions/${MOCK_MISSION_OK_ID}`);
    expect(missionOpenHref(card, 'upcoming')).toBe(
      `/missions/${MOCK_MISSION_OK_ID}/active`,
    );
    expect(missionOpenHref({ ...card, inProgress: true }, 'active')).toBe(
      `/missions/${MOCK_MISSION_OK_ID}/execute`,
    );
  });

  it('P05 : Terminer reste bloqué tant que 2+2 et checklist incomplets', async () => {
    await acceptMission(MOCK_MISSION_OK_ID);
    await startEnRoute(MOCK_MISSION_OK_ID);
    await markArrived(MOCK_MISSION_OK_ID);
    let execution = await fetchExecution(MOCK_MISSION_OK_ID);
    expect(canCompleteExecution(execution)).toBe(false);
    execution = await addExecutionPhoto(MOCK_MISSION_OK_ID, 'before');
    execution = await addExecutionPhoto(MOCK_MISSION_OK_ID, 'before');
    execution = await addExecutionPhoto(MOCK_MISSION_OK_ID, 'after');
    execution = await addExecutionPhoto(MOCK_MISSION_OK_ID, 'after');
    expect(canCompleteExecution(execution)).toBe(false);
    for (const item of execution.checklist) {
      execution = await toggleChecklistItem(
        MOCK_MISSION_OK_ID,
        item.id,
        execution,
      );
    }
    expect(canCompleteExecution(execution)).toBe(true);
    const done = await completeMission(MOCK_MISSION_OK_ID);
    expect(done.payout).toBe('pending');
    expect(done.netLabel).toBe('77,60 € net');
    const board = await fetchMissionBoard();
    expect(board.active).toEqual([]);
  });
});
