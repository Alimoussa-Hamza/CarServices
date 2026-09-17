import { api, initApiClient } from '@carservice/api-client';
import type {
  AdminCategory,
  AdminCreateOfferInput,
  AdminCreateOfferOptionInput,
  AdminDashboard,
  AdminKycDecisionResponse,
  AdminOffer,
  AdminOfferOption,
  AdminPendingProvidersResponse,
  AdminUpdateCategoryDto,
  AdminUpdateOfferDto,
  AdminUpdateOfferOptionDto,
} from '@carservice/shared-types';
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

export async function fetchPendingKyc(): Promise<AdminPendingProvidersResponse> {
  bootstrapAdminApi();
  return api.admin.listPendingProviders();
}

export async function approvePendingKyc(
  providerId: string,
): Promise<AdminKycDecisionResponse> {
  bootstrapAdminApi();
  return api.admin.approveProvider(providerId);
}

export async function rejectPendingKyc(
  providerId: string,
  reason: string,
): Promise<AdminKycDecisionResponse> {
  bootstrapAdminApi();
  return api.admin.rejectProvider(providerId, { reason });
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  bootstrapAdminApi();
  return api.admin.listCategories();
}

export async function patchAdminCategory(
  categoryId: string,
  dto: AdminUpdateCategoryDto,
): Promise<AdminCategory> {
  bootstrapAdminApi();
  return api.admin.updateCategory(categoryId, dto);
}

export async function fetchAdminOffers(): Promise<AdminOffer[]> {
  bootstrapAdminApi();
  return api.admin.listOffers();
}

export async function createAdminOffer(
  dto: AdminCreateOfferInput,
): Promise<AdminOffer> {
  bootstrapAdminApi();
  return api.admin.createOffer(dto);
}

export async function patchAdminOffer(
  offerId: string,
  dto: AdminUpdateOfferDto,
): Promise<AdminOffer> {
  bootstrapAdminApi();
  return api.admin.updateOffer(offerId, dto);
}

export async function createAdminOfferOption(
  offerId: string,
  dto: AdminCreateOfferOptionInput,
): Promise<AdminOfferOption> {
  bootstrapAdminApi();
  return api.admin.createOfferOption(offerId, dto);
}

export async function patchAdminOfferOption(
  optionId: string,
  dto: AdminUpdateOfferOptionDto,
): Promise<AdminOfferOption> {
  bootstrapAdminApi();
  return api.admin.updateOfferOption(optionId, dto);
}
