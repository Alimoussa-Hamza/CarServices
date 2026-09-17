import { api, initApiClient } from '@carservice/api-client';
import type { AdminDashboard } from '@carservice/shared-types';
import { env } from './env';
import {
  clearAdminSession,
  readAdminSession,
  writeAdminSession,
  type StoredAdminSession,
} from './auth-storage';

let bootstrapped = false;

export function bootstrapAdminApi(): void {
  if (bootstrapped) {
    return;
  }
  initApiClient({
    baseUrl: env.apiUrl,
    getAccessToken: async () => readAdminSession()?.accessToken ?? null,
  });
  bootstrapped = true;
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<StoredAdminSession> {
  bootstrapAdminApi();
  const tokens = await api.auth.adminLogin({ email, password });
  const session = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
  writeAdminSession(session);
  return session;
}

export async function logoutAdmin(): Promise<void> {
  bootstrapAdminApi();
  const session = readAdminSession();
  clearAdminSession();
  if (!session) {
    return;
  }
  try {
    await api.auth.logout({ refreshToken: session.refreshToken });
  } catch {
    // session locale déjà effacée
  }
}

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  bootstrapAdminApi();
  return api.admin.dashboard();
}
