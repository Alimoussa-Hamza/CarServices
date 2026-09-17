import { create } from 'zustand';

export type MissionTab = 'new' | 'upcoming' | 'active';
export type PauseChoice = '1h' | 'today' | 'manual';

type MissionsUiState = {
  tab: MissionTab;
  pauseSheetOpen: boolean;
  pauseChoice: PauseChoice;
  pausedUntil: number | null;
  notificationsEnabled: boolean;
  setTab: (tab: MissionTab) => void;
  setNotificationsEnabled: (value: boolean) => void;
  openPauseSheet: () => void;
  closePauseSheet: () => void;
  setPauseChoice: (choice: PauseChoice) => void;
  confirmPause: (now?: number) => void;
  resume: () => void;
};

function pausedUntilFromChoice(choice: PauseChoice, now: number): number {
  if (choice === '1h') {
    return now + 60 * 60 * 1000;
  }
  if (choice === 'today') {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return end.getTime();
  }
  return now + 10 * 365 * 24 * 60 * 60 * 1000;
}

export const useMissionsUiStore = create<MissionsUiState>((set) => ({
  tab: 'new',
  pauseSheetOpen: false,
  pauseChoice: '1h',
  pausedUntil: null,
  notificationsEnabled: true,
  setTab: (tab) => set({ tab }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  openPauseSheet: () => set({ pauseSheetOpen: true, pauseChoice: '1h' }),
  closePauseSheet: () => set({ pauseSheetOpen: false }),
  setPauseChoice: (pauseChoice) => set({ pauseChoice }),
  confirmPause: (now = Date.now()) =>
    set((state) => ({
      pausedUntil: pausedUntilFromChoice(state.pauseChoice, now),
      pauseSheetOpen: false,
    })),
  resume: () => set({ pausedUntil: null, pauseSheetOpen: false }),
}));

export function isMissionsPaused(
  pausedUntil: number | null,
  now = Date.now(),
): boolean {
  return pausedUntil !== null && pausedUntil > now;
}
