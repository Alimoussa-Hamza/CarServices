import {
  AdminLoginDto,
  AdminDashboardSchema,
  AdminPendingProvidersResponseSchema,
  AdminKycDecisionResponseSchema,
  AdminRejectKycDto,
  AdminCategorySchema,
  AdminOfferSchema,
  AdminOfferOptionSchema,
  AdminCreateOfferInput,
  AdminUpdateCategoryDto,
  AdminUpdateOfferDto,
  AdminCreateOfferOptionInput,
  AdminUpdateOfferOptionDto,
  AdminCreateZoneInput,
  AdminUpdateZoneDto,
  AdminUpsertZonePricingDto,
  AdminZoneSchema,
  AdminZonePricingSchema,
  AdminListBookingsQuery,
  AdminBookingsListResponseSchema,
  AdminBookingDetailSchema,
  AdminRefundBookingDto,
  AdminRefundResponseSchema,
  AuthTokensResponseSchema,
  CatalogQuoteDto,
  CatalogQuoteResponseSchema,
  AcceptedBookingSchema,
  AvailableBookingSchema,
  BookingDetailSchema,
  BookingListItemSchema,
  BookingStatusUpdateSchema,
  CancelBookingDto,
  CancelledBookingSchema,
  ConfirmMediaUploadDto,
  ConfirmedMediaUploadSchema,
  CreateBookingDto,
  CreateBookingResponseSchema,
  CreateMediaUploadUrlDto,
  CreateReviewDto,
  CreatedReviewSchema,
  ListProviderReviewsQuery,
  ProviderReviewsResponseSchema,
  CreateDisputeDto,
  CreatedDisputeSchema,
  RegisterPushTokenDto,
  RegisteredPushTokenSchema,
  DeclineBookingDto,
  DeclinedBookingSchema,
  ListBookingsQuery,
  MediaUploadUrlResponseSchema,
  PatchBookingStatusDto,
  SlotPickerRequest,
  SlotPickerResponseSchema,
  CreateStripeOnboardingLinkDto,
  HealthResponseSchema,
  KycStatusResponseSchema,
  OutOfZoneLeadDto,
  ProviderAvailabilityResponseSchema,
  ProviderCapabilitiesResponseSchema,
  ProviderKycAlertsResponseSchema,
  ProviderMissionEligibilitySchema,
  ProviderProfileSchema,
  ProviderZonesResponseSchema,
  RefreshTokenDto,
  SendOtpDto,
  SendOtpResponseSchema,
  ServiceCategorySchema,
  ServiceOfferSchema,
  StripeOnboardingLinkResponseSchema,
  SubmitKycDto,
  UpdateProviderAvailabilityDto,
  UpdateProviderCapabilitiesDto,
  UpdateProviderProfileDto,
  UpdateProviderZonesDto,
  VerifyOtpDto,
  ZoneCheckDto,
  ZoneCheckResponseSchema,
} from '@carservice/shared-types';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiClientConfig = {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null>;
};

let config: ApiClientConfig = { baseUrl: 'http://localhost:3000' };

export function initApiClient(clientConfig: ApiClientConfig): void {
  config = clientConfig;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = await config.getAccessToken?.();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${config.baseUrl}${path}`, {
    ...options,
    headers,
  });

  const body = (await res.json()) as {
    data?: T;
    error?: { code: string; message: string };
  };

  if (!res.ok) {
    throw new ApiError(
      body.error?.code ?? 'UNKNOWN_ERROR',
      body.error?.message ?? res.statusText,
      res.status,
    );
  }

  return body.data as T;
}

export const api = {
  health: {
    check: () =>
      apiRequest<{ status: string; timestamp: string }>('/api/v1/health').then(
        (data) => HealthResponseSchema.parse(data),
      ),
  },
  auth: {
    sendOtp: (dto: SendOtpDto) =>
      apiRequest<{ expiresIn: number; retryAfter: number | null }>(
        '/api/v1/auth/otp/send',
        { method: 'POST', body: JSON.stringify(dto) },
      ).then((data) => SendOtpResponseSchema.parse(data)),
    verifyOtp: (dto: VerifyOtpDto) =>
      apiRequest('/api/v1/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => AuthTokensResponseSchema.parse(data)),
    adminLogin: (dto: AdminLoginDto) =>
      apiRequest('/api/v1/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => AuthTokensResponseSchema.parse(data)),
    refresh: (dto: RefreshTokenDto) =>
      apiRequest('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => AuthTokensResponseSchema.omit({ user: true }).parse(data)),
    logout: (dto: RefreshTokenDto) =>
      apiRequest<{ success: boolean }>('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    me: () => apiRequest('/api/v1/auth/me'),
  },
  catalog: {
    categories: () =>
      apiRequest('/api/v1/catalog/categories').then((data) =>
        ServiceCategorySchema.array().parse(data),
      ),
    offers: (zone?: string) => {
      const query = zone ? `?zone=${encodeURIComponent(zone)}` : '';
      return apiRequest(`/api/v1/catalog/offers${query}`).then((data) =>
        ServiceOfferSchema.array().parse(data),
      );
    },
    offer: (id: string) =>
      apiRequest(`/api/v1/catalog/offers/${id}`).then((data) =>
        ServiceOfferSchema.parse(data),
      ),
    quote: (dto: CatalogQuoteDto) =>
      apiRequest('/api/v1/catalog/quote', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => CatalogQuoteResponseSchema.parse(data)),
  },
  zones: {
    check: (dto: ZoneCheckDto) =>
      apiRequest('/api/v1/zones/check', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => ZoneCheckResponseSchema.parse(data)),
    createLead: (dto: OutOfZoneLeadDto) =>
      apiRequest<{ id: string; captured: boolean }>('/api/v1/zones/leads', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
  },
  providers: {
    me: () =>
      apiRequest('/api/v1/providers/me').then((data) =>
        ProviderProfileSchema.parse(data),
      ),
    updateMe: (dto: UpdateProviderProfileDto) =>
      apiRequest('/api/v1/providers/me', {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }).then((data) => ProviderProfileSchema.parse(data)),
    submitKyc: (dto: SubmitKycDto) =>
      apiRequest('/api/v1/providers/kyc/submit', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => KycStatusResponseSchema.parse(data)),
    kycStatus: () =>
      apiRequest('/api/v1/providers/kyc/status').then((data) =>
        KycStatusResponseSchema.parse(data),
      ),
    kycAlerts: () =>
      apiRequest('/api/v1/providers/kyc/alerts').then((data) =>
        ProviderKycAlertsResponseSchema.parse(data),
      ),
    missionEligibility: () =>
      apiRequest('/api/v1/providers/missions/eligibility').then((data) =>
        ProviderMissionEligibilitySchema.parse(data),
      ),
    capabilities: () =>
      apiRequest('/api/v1/providers/capabilities').then((data) =>
        ProviderCapabilitiesResponseSchema.parse(data),
      ),
    updateCapabilities: (dto: UpdateProviderCapabilitiesDto) =>
      apiRequest('/api/v1/providers/capabilities', {
        method: 'PUT',
        body: JSON.stringify(dto),
      }).then((data) => ProviderCapabilitiesResponseSchema.parse(data)),
    availability: () =>
      apiRequest('/api/v1/providers/availability').then((data) =>
        ProviderAvailabilityResponseSchema.parse(data),
      ),
    updateAvailability: (dto: UpdateProviderAvailabilityDto) =>
      apiRequest('/api/v1/providers/availability', {
        method: 'PUT',
        body: JSON.stringify(dto),
      }).then((data) => ProviderAvailabilityResponseSchema.parse(data)),
    zones: () =>
      apiRequest('/api/v1/providers/zones').then((data) =>
        ProviderZonesResponseSchema.parse(data),
      ),
    updateZones: (dto: UpdateProviderZonesDto) =>
      apiRequest('/api/v1/providers/zones', {
        method: 'PUT',
        body: JSON.stringify(dto),
      }).then((data) => ProviderZonesResponseSchema.parse(data)),
    createStripeOnboardingLink: (dto: CreateStripeOnboardingLinkDto) =>
      apiRequest('/api/v1/providers/stripe/onboard', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => StripeOnboardingLinkResponseSchema.parse(data)),
  },
  bookings: {
    create: (dto: CreateBookingDto) =>
      apiRequest('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => CreateBookingResponseSchema.parse(data)),
    slots: (dto: SlotPickerRequest) =>
      apiRequest('/api/v1/bookings/slots', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => SlotPickerResponseSchema.parse(data)),
    available: () =>
      apiRequest('/api/v1/bookings/available').then((data) =>
        AvailableBookingSchema.array().parse(data),
      ),
    list: (query: ListBookingsQuery = {}) => {
      const params = new URLSearchParams();
      if (query.status?.length) {
        params.set('status', query.status.join(','));
      }
      if (query.group) {
        params.set('group', query.group);
      }
      const qs = params.toString();
      return apiRequest(`/api/v1/bookings${qs ? `?${qs}` : ''}`).then((data) =>
        BookingListItemSchema.array().parse(data),
      );
    },
    get: (bookingId: string) =>
      apiRequest(`/api/v1/bookings/${bookingId}`).then((data) =>
        BookingDetailSchema.parse(data),
      ),
    accept: (bookingId: string) =>
      apiRequest(`/api/v1/bookings/${bookingId}/accept`, {
        method: 'POST',
      }).then((data) => AcceptedBookingSchema.parse(data)),
    decline: (bookingId: string, dto: DeclineBookingDto = {}) =>
      apiRequest(`/api/v1/bookings/${bookingId}/decline`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => DeclinedBookingSchema.parse(data)),
    updateStatus: (bookingId: string, dto: PatchBookingStatusDto) =>
      apiRequest(`/api/v1/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }).then((data) => BookingStatusUpdateSchema.parse(data)),
    cancel: (bookingId: string, dto: CancelBookingDto = {}) =>
      apiRequest(`/api/v1/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }).then((data) => CancelledBookingSchema.parse(data)),
  },
  admin: {
    dashboard: () =>
      apiRequest('/api/v1/admin/dashboard').then((data) =>
        AdminDashboardSchema.parse(data),
      ),
    listPendingProviders: () =>
      apiRequest('/api/v1/admin/providers/pending').then((data) =>
        AdminPendingProvidersResponseSchema.parse(data),
      ),
    approveProvider: (providerId: string) =>
      apiRequest(`/api/v1/admin/providers/${providerId}/approve`, {
        method: 'POST',
      }).then((data) => AdminKycDecisionResponseSchema.parse(data)),
    rejectProvider: (providerId: string, dto: AdminRejectKycDto) =>
      apiRequest(`/api/v1/admin/providers/${providerId}/reject`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => AdminKycDecisionResponseSchema.parse(data)),
    listCategories: () =>
      apiRequest('/api/v1/admin/catalog/categories').then((data) =>
        AdminCategorySchema.array().parse(data),
      ),
    updateCategory: (categoryId: string, dto: AdminUpdateCategoryDto) =>
      apiRequest(`/api/v1/admin/catalog/categories/${categoryId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }).then((data) => AdminCategorySchema.parse(data)),
    listOffers: () =>
      apiRequest('/api/v1/admin/catalog/offers').then((data) =>
        AdminOfferSchema.array().parse(data),
      ),
    getOffer: (offerId: string) =>
      apiRequest(`/api/v1/admin/catalog/offers/${offerId}`).then((data) =>
        AdminOfferSchema.parse(data),
      ),
    createOffer: (dto: AdminCreateOfferInput) =>
      apiRequest('/api/v1/admin/catalog/offers', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => AdminOfferSchema.parse(data)),
    updateOffer: (offerId: string, dto: AdminUpdateOfferDto) =>
      apiRequest(`/api/v1/admin/catalog/offers/${offerId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }).then((data) => AdminOfferSchema.parse(data)),
    createOfferOption: (offerId: string, dto: AdminCreateOfferOptionInput) =>
      apiRequest(`/api/v1/admin/catalog/offers/${offerId}/options`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => AdminOfferOptionSchema.parse(data)),
    updateOfferOption: (optionId: string, dto: AdminUpdateOfferOptionDto) =>
      apiRequest(`/api/v1/admin/catalog/options/${optionId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }).then((data) => AdminOfferOptionSchema.parse(data)),
    listZones: () =>
      apiRequest('/api/v1/admin/zones').then((data) =>
        AdminZoneSchema.array().parse(data),
      ),
    getZone: (zoneId: string) =>
      apiRequest(`/api/v1/admin/zones/${zoneId}`).then((data) =>
        AdminZoneSchema.parse(data),
      ),
    createZone: (dto: AdminCreateZoneInput) =>
      apiRequest('/api/v1/admin/zones', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => AdminZoneSchema.parse(data)),
    updateZone: (zoneId: string, dto: AdminUpdateZoneDto) =>
      apiRequest(`/api/v1/admin/zones/${zoneId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }).then((data) => AdminZoneSchema.parse(data)),
    listZonePricing: (zoneId: string) =>
      apiRequest(`/api/v1/admin/zones/${zoneId}/pricing`).then((data) =>
        AdminZonePricingSchema.array().parse(data),
      ),
    upsertZonePricing: (
      zoneId: string,
      offerId: string,
      dto: AdminUpsertZonePricingDto,
    ) =>
      apiRequest(`/api/v1/admin/zones/${zoneId}/pricing/${offerId}`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      }).then((data) => AdminZonePricingSchema.parse(data)),
    listBookings: (query: Partial<AdminListBookingsQuery> = {}) => {
      const params = new URLSearchParams();
      if (query.q) {
        params.set('q', query.q);
      }
      if (query.status?.length) {
        params.set('status', query.status.join(','));
      }
      if (query.page !== undefined) {
        params.set('page', String(query.page));
      }
      if (query.pageSize !== undefined) {
        params.set('pageSize', String(query.pageSize));
      }
      const qs = params.toString();
      return apiRequest(`/api/v1/admin/bookings${qs ? `?${qs}` : ''}`).then(
        (data) => AdminBookingsListResponseSchema.parse(data),
      );
    },
    getBooking: (bookingId: string) =>
      apiRequest(`/api/v1/admin/bookings/${bookingId}`).then((data) =>
        AdminBookingDetailSchema.parse(data),
      ),
    refundBooking: (bookingId: string, dto: AdminRefundBookingDto = {}) =>
      apiRequest(`/api/v1/admin/bookings/${bookingId}/refund`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => AdminRefundResponseSchema.parse(data)),
  },
  media: {
    createUploadUrl: (dto: CreateMediaUploadUrlDto) =>
      apiRequest('/api/v1/media/upload-url', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => MediaUploadUrlResponseSchema.parse(data)),
    confirmUpload: (dto: ConfirmMediaUploadDto) =>
      apiRequest('/api/v1/media/confirm', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => ConfirmedMediaUploadSchema.parse(data)),
  },
  reviews: {
    create: (dto: CreateReviewDto) =>
      apiRequest('/api/v1/reviews', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => CreatedReviewSchema.parse(data)),
    listByProvider: (
      providerId: string,
      query: Partial<ListProviderReviewsQuery> = {},
    ) => {
      const params = new URLSearchParams();
      if (query.page !== undefined) {
        params.set('page', String(query.page));
      }
      if (query.pageSize !== undefined) {
        params.set('pageSize', String(query.pageSize));
      }
      const qs = params.toString();
      return apiRequest(
        `/api/v1/reviews/provider/${providerId}${qs ? `?${qs}` : ''}`,
      ).then((data) => ProviderReviewsResponseSchema.parse(data));
    },
  },
  disputes: {
    create: (dto: CreateDisputeDto) =>
      apiRequest('/api/v1/disputes', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => CreatedDisputeSchema.parse(data)),
  },
  users: {
    registerPushToken: (dto: RegisterPushTokenDto) =>
      apiRequest('/api/v1/users/push-token', {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => RegisteredPushTokenSchema.parse(data)),
  },
};

export type {
  AdminRefundBookingDto,
  CatalogQuoteDto,
  ConfirmMediaUploadDto,
  CreateBookingDto,
  CreateMediaUploadUrlDto,
  CreateReviewDto,
  ListProviderReviewsQuery,
  CreateDisputeDto,
  RegisterPushTokenDto,
  DeclineBookingDto,
  PatchBookingStatusDto,
  CancelBookingDto,
  ListBookingsQuery,
  SlotPickerRequest,
  CreateStripeOnboardingLinkDto,
  OutOfZoneLeadDto,
  SubmitKycDto,
  UpdateProviderAvailabilityDto,
  UpdateProviderCapabilitiesDto,
  UpdateProviderProfileDto,
  UpdateProviderZonesDto,
  RefreshTokenDto,
  SendOtpDto,
  VerifyOtpDto,
  ZoneCheckDto,
};
