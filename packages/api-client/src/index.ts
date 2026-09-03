import {
  AuthTokensResponseSchema,
  CatalogQuoteDto,
  CatalogQuoteResponseSchema,
  HealthResponseSchema,
  KycStatusResponseSchema,
  OutOfZoneLeadDto,
  ProviderCapabilitiesResponseSchema,
  ProviderProfileSchema,
  RefreshTokenDto,
  SendOtpDto,
  SendOtpResponseSchema,
  ServiceCategorySchema,
  ServiceOfferSchema,
  SubmitKycDto,
  UpdateProviderCapabilitiesDto,
  UpdateProviderProfileDto,
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
    capabilities: () =>
      apiRequest('/api/v1/providers/capabilities').then((data) =>
        ProviderCapabilitiesResponseSchema.parse(data),
      ),
    updateCapabilities: (dto: UpdateProviderCapabilitiesDto) =>
      apiRequest('/api/v1/providers/capabilities', {
        method: 'PUT',
        body: JSON.stringify(dto),
      }).then((data) => ProviderCapabilitiesResponseSchema.parse(data)),
  },
};

export type {
  CatalogQuoteDto,
  OutOfZoneLeadDto,
  SubmitKycDto,
  UpdateProviderCapabilitiesDto,
  UpdateProviderProfileDto,
  RefreshTokenDto,
  SendOtpDto,
  VerifyOtpDto,
  ZoneCheckDto,
};
