import {
  isMissionsPaused,
  useMissionsUiStore,
} from '../missions-ui.store';

describe('missions ui store', () => {
  beforeEach(() => {
    useMissionsUiStore.setState({
      tab: 'new',
      pauseSheetOpen: false,
      pauseChoice: '1h',
      pausedUntil: null,
      notificationsEnabled: true,
    });
  });

  it('confirme une pause 1 h sans Skip missions', () => {
    const now = Date.parse('2026-09-17T10:00:00.000Z');
    useMissionsUiStore.getState().openPauseSheet();
    useMissionsUiStore.getState().confirmPause(now);
    expect(
      isMissionsPaused(useMissionsUiStore.getState().pausedUntil, now + 1000),
    ).toBe(true);
    expect(useMissionsUiStore.getState().pauseSheetOpen).toBe(false);
  });

  it('reprend les missions', () => {
    useMissionsUiStore.setState({ pausedUntil: Date.now() + 10_000 });
    useMissionsUiStore.getState().resume();
    expect(useMissionsUiStore.getState().pausedUntil).toBeNull();
  });
});
