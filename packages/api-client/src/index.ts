import {
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
  CreateBookingDto,
  CreateBookingResponseSchema,
  DeclineBookingDto,
  DeclinedBookingSchema,
  ListBookingsQuery,
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
    refundBooking: (bookingId: string, dto: AdminRefundBookingDto = {}) =>
      apiRequest(`/api/v1/admin/bookings/${bookingId}/refund`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }).then((data) => AdminRefundResponseSchema.parse(data)),
  },
};

export type {
  AdminRefundBookingDto,
  CatalogQuoteDto,
  CreateBookingDto,
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
