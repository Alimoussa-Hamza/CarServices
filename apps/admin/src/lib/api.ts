import { api, initApiClient } from '@carservice/api-client';
import type {
  AdminBookingDetail,
  AdminBookingsListResponse,
  AdminCategory,
  AdminCreateOfferInput,
  AdminCreateOfferOptionInput,
  AdminCreateZoneInput,
  AdminDashboard,
  AdminKycDecisionResponse,
  AdminListBookingsQuery,
  AdminOffer,
  AdminOfferOption,
  AdminPendingProvidersResponse,
  AdminRefundBookingDto,
  AdminRefundResponse,
  AdminUpdateCategoryDto,
  AdminUpdateOfferDto,
  AdminUpdateOfferOptionDto,
  AdminUpdateZoneDto,
  AdminUpsertZonePricingDto,
  AdminZone,
  AdminZonePricing,
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

export async function fetchAdminZones(): Promise<AdminZone[]> {
  bootstrapAdminApi();
  return api.admin.listZones();
}

export async function createAdminZone(
  dto: AdminCreateZoneInput,
): Promise<AdminZone> {
  bootstrapAdminApi();
  return api.admin.createZone(dto);
}

export async function patchAdminZone(
  zoneId: string,
  dto: AdminUpdateZoneDto,
): Promise<AdminZone> {
  bootstrapAdminApi();
  return api.admin.updateZone(zoneId, dto);
}

export async function fetchAdminZonePricing(
  zoneId: string,
): Promise<AdminZonePricing[]> {
  bootstrapAdminApi();
  return api.admin.listZonePricing(zoneId);
}

export async function putAdminZonePricing(
  zoneId: string,
  offerId: string,
  dto: AdminUpsertZonePricingDto,
): Promise<AdminZonePricing> {
  bootstrapAdminApi();
  return api.admin.upsertZonePricing(zoneId, offerId, dto);
}

export async function fetchAdminBookings(
  query: Partial<AdminListBookingsQuery> = {},
): Promise<AdminBookingsListResponse> {
  bootstrapAdminApi();
  return api.admin.listBookings(query);
}

export async function fetchAdminBooking(
  bookingId: string,
): Promise<AdminBookingDetail> {
  bootstrapAdminApi();
  return api.admin.getBooking(bookingId);
}

export async function refundAdminBooking(
  bookingId: string,
  dto: AdminRefundBookingDto = {},
): Promise<AdminRefundResponse> {
  bootstrapAdminApi();
  return api.admin.refundBooking(bookingId, dto);
}
