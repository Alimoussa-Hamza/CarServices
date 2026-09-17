import { useNotifPrefsStore } from '../notif-prefs.store';

describe('notif prefs', () => {
  beforeEach(() => {
    useNotifPrefsStore.setState({
      newMissions: true,
      sound: true,
      reminderH1: true,
      account: true,
      permissionAsked: false,
    });
  });

  it('grise le son si Nouvelles missions off', () => {
    useNotifPrefsStore.getState().setSound(true);
    useNotifPrefsStore.getState().setNewMissions(false);
    expect(useNotifPrefsStore.getState().sound).toBe(false);
  });
});
