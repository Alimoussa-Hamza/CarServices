const ACCESS_KEY = 'cs_admin_access';
const REFRESH_KEY = 'cs_admin_refresh';

export type StoredAdminSession = {
  accessToken: string;
  refreshToken: string;
};

export function readAdminSession(): StoredAdminSession | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const accessToken = window.localStorage.getItem(ACCESS_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) {
    return null;
  }
  return { accessToken, refreshToken };
}

export function writeAdminSession(session: StoredAdminSession): void {
  window.localStorage.setItem(ACCESS_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_KEY, session.refreshToken);
}

export function clearAdminSession(): void {
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function hasAdminSession(): boolean {
  return readAdminSession() !== null;
}
