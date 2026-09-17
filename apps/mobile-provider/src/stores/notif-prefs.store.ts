import { create } from 'zustand';

type NotifPrefsState = {
  newMissions: boolean;
  sound: boolean;
  reminderH1: boolean;
  account: boolean;
  permissionAsked: boolean;
  setNewMissions: (value: boolean) => void;
  setSound: (value: boolean) => void;
  setReminderH1: (value: boolean) => void;
  setAccount: (value: boolean) => void;
  markPermissionAsked: () => void;
};

export const useNotifPrefsStore = create<NotifPrefsState>((set) => ({
  newMissions: true,
  sound: false,
  reminderH1: true,
  account: true,
  permissionAsked: false,
  setNewMissions: (newMissions) =>
    set((state) => ({
      newMissions,
      sound: newMissions ? state.sound : false,
    })),
  setSound: (sound) => set((state) => ({ sound: state.newMissions ? sound : false })),
  setReminderH1: (reminderH1) => set({ reminderH1 }),
  setAccount: (account) => set({ account }),
  markPermissionAsked: () => set({ permissionAsked: true }),
}));
