import { readAdminSession, writeAdminSession, clearAdminSession } from '../auth-storage';

describe('auth-storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns null when empty', () => {
    expect(readAdminSession()).toBeNull();
  });

  it('persists and clears session', () => {
    writeAdminSession({ accessToken: 'a', refreshToken: 'r' });
    expect(readAdminSession()).toEqual({
      accessToken: 'a',
      refreshToken: 'r',
    });
    clearAdminSession();
    expect(readAdminSession()).toBeNull();
  });
});
