import { ApiError, api, apiRequest, initApiClient } from '../index';

type FetchMock = jest.Mock<Promise<Partial<Response>>, [string, RequestInit?]>;

function mockFetchResponse(body: unknown, init: Partial<Response> = {}) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn().mockResolvedValue(body),
    ...init,
  };
}

describe('api-client', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    initApiClient({ baseUrl: 'http://api.test' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('apiRequest', () => {
    it('préfixe l’URL et retourne body.data', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ data: { status: 'ok' } }),
      );

      await expect(apiRequest('/health')).resolves.toEqual({ status: 'ok' });

      expect(fetchMock).toHaveBeenCalledWith('http://api.test/health', {
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('ajoute le Bearer token quand getAccessToken en fournit un', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ data: { ok: true } }));
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('access.jwt'),
      });

      await apiRequest('/protected', { method: 'POST' });

      expect(fetchMock).toHaveBeenCalledWith('http://api.test/protected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer access.jwt',
        },
      });
    });

    it('préserve les headers custom', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ data: { ok: true } }));

      await apiRequest('/custom', {
        headers: { 'X-Request-Id': 'request-id' },
      });

      expect(fetchMock).toHaveBeenCalledWith('http://api.test/custom', {
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': 'request-id',
        },
      });
    });

    it('lève ApiError avec le code et message du contrat erreur', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse(
          {
            error: {
              code: 'OTP_INVALID',
              message: 'Code expiré ou invalide.',
            },
          },
          { ok: false, status: 401, statusText: 'Unauthorized' },
        ),
      );

      await expect(apiRequest('/auth/otp/verify')).rejects.toMatchObject({
        name: 'ApiError',
        code: 'OTP_INVALID',
        message: 'Code expiré ou invalide.',
        status: 401,
      } satisfies Partial<ApiError>);
    });

    it('utilise un fallback stable si le serveur ne renvoie pas error', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({}, { ok: false, status: 500, statusText: 'Boom' }),
      );

      await expect(apiRequest('/broken')).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'Boom',
        status: 500,
      });
    });
  });

  describe('api.health', () => {
    it('valide la réponse health avec Zod', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: { status: 'ok', timestamp: '2026-09-03T13:42:47.106Z' },
        }),
      );

      await expect(api.health.check()).resolves.toEqual({
        status: 'ok',
        timestamp: '2026-09-03T13:42:47.106Z',
      });
    });

    it('rejette une réponse health invalide', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ data: { status: 'degraded', timestamp: 'bad' } }),
      );

      await expect(api.health.check()).rejects.toThrow();
    });
  });

  describe('api.auth', () => {
    it('envoie OTP sur le bon endpoint et valide la réponse', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ data: { expiresIn: 300, retryAfter: null } }),
      );

      await expect(
        api.auth.sendOtp({ phone: '+33612345678', role: 'client' }),
      ).resolves.toEqual({ expiresIn: 300, retryAfter: null });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/auth/otp/send',
        {
          method: 'POST',
          body: JSON.stringify({ phone: '+33612345678', role: 'client' }),
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it('vérifie OTP sur le bon endpoint et valide les tokens', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: {
            accessToken: 'access.jwt',
            refreshToken: 'refresh-token',
            expiresIn: 900,
            user: {
              id: '4e165206-73f4-4987-86dd-eafde885a323',
              role: 'client',
              phone: '+33612345678',
            },
          },
        }),
      );

      await expect(
        api.auth.verifyOtp({
          phone: '+33612345678',
          code: '123456',
          acceptTerms: true,
        }),
      ).resolves.toMatchObject({
        accessToken: 'access.jwt',
        expiresIn: 900,
        user: { role: 'client' },
      });
    });

    it('login admin email/password et valide les tokens', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: {
            accessToken: 'admin.access.jwt',
            refreshToken: 'admin-refresh-token',
            expiresIn: 900,
            user: {
              id: '4e165206-73f4-4987-86dd-eafde885a323',
              role: 'admin',
              phone: '+33600000000',
              email: 'admin@carservice.fr',
            },
          },
        }),
      );

      await expect(
        api.auth.adminLogin({
          email: 'admin@carservice.fr',
          password: 'AdminTest123!',
        }),
      ).resolves.toMatchObject({
        accessToken: 'admin.access.jwt',
        user: { role: 'admin', email: 'admin@carservice.fr' },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/auth/admin/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'admin@carservice.fr',
            password: 'AdminTest123!',
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it('rafraîchit une session et valide les nouveaux tokens', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: {
            accessToken: 'new-access.jwt',
            refreshToken: 'new-refresh-token',
            expiresIn: 900,
          },
        }),
      );

      await expect(
        api.auth.refresh({ refreshToken: 'old-refresh-token' }),
      ).resolves.toEqual({
        accessToken: 'new-access.jwt',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: 'old-refresh-token' }),
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it('déconnecte avec le refresh token courant', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ data: { success: true } }));
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('access.jwt'),
      });

      await expect(
        api.auth.logout({ refreshToken: 'refresh-token' }),
      ).resolves.toEqual({ success: true });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/auth/logout',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: 'refresh-token' }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer access.jwt',
          },
        },
      );
    });

    it('appelle /auth/me avec Authorization via getAccessToken', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: { id: 'user-id', role: 'client', phone: '+33612345678' },
        }),
      );
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('access.jwt'),
      });

      await expect(api.auth.me()).resolves.toEqual({
        id: 'user-id',
        role: 'client',
        phone: '+33612345678',
      });

      expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/v1/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer access.jwt',
        },
      });
    });
  });

  describe('api.catalog', () => {
    const offer = {
      id: '22222222-2222-4222-8222-222222222222',
      slug: 'wash-complete',
      name: 'Lavage complet',
      description: 'Intérieur et extérieur.',
      basePriceCents: 8500,
      durationMinutes: 90,
      category: { slug: 'wash', name: 'Lavage auto' },
      options: [],
    };

    it('récupère les catégories catalogue', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              slug: 'wash',
              name: 'Lavage auto',
              description: null,
              icon: 'sparkles',
            },
          ],
        }),
      );

      await expect(api.catalog.categories()).resolves.toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/catalog/categories',
        { headers: { 'Content-Type': 'application/json' } },
      );
    });

    it('récupère les offres avec filtre zone encodé', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ data: [offer] }));

      await expect(api.catalog.offers('lyon centre')).resolves.toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/catalog/offers?zone=lyon%20centre',
        { headers: { 'Content-Type': 'application/json' } },
      );
    });

    it('récupère le détail d’une offre', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ data: offer }));

      await expect(api.catalog.offer(offer.id)).resolves.toEqual(offer);
    });

    it('calcule une quote et valide le breakdown', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: {
            breakdown: {
              base: 8500,
              vehicleSurcharge: 1000,
              options: [],
              serviceFee: 200,
              totalCents: 9700,
              currency: 'EUR',
            },
            durationMinutes: 90,
          },
        }),
      );

      await expect(
        api.catalog.quote({
          offerId: offer.id,
          vehicleType: 'suv',
          optionIds: [],
          zoneSlug: 'lyon',
          dirtLevel: 'normal',
        }),
      ).resolves.toMatchObject({
        breakdown: { totalCents: 9700, currency: 'EUR' },
      });
    });
  });

  describe('api.zones', () => {
    it('vérifie la couverture d’un point GPS', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: {
            covered: true,
            zone: {
              id: '44444444-4444-4444-8444-444444444444',
              name: 'Lyon',
              slug: 'lyon',
            },
          },
        }),
      );

      await expect(
        api.zones.check({ lat: 45.764, lng: 4.835, postalCode: '69002' }),
      ).resolves.toEqual({
        covered: true,
        zone: {
          id: '44444444-4444-4444-8444-444444444444',
          name: 'Lyon',
          slug: 'lyon',
        },
      });
    });

    it('capture un lead hors zone', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: {
            id: '55555555-5555-4555-8555-555555555555',
            captured: true,
          },
        }),
      );

      await expect(
        api.zones.createLead({
          email: 'client@example.com',
          lat: 44.0,
          lng: 4.0,
          addressText: 'Adresse hors zone',
        }),
      ).resolves.toEqual({
        id: '55555555-5555-4555-8555-555555555555',
        captured: true,
      });
    });
  });

  describe('api.providers', () => {
    const providerProfile = {
      id: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
      companyName: 'Clean Auto Lyon',
      siret: '12345678901234',
      bio: 'Lavage écologique à domicile.',
      avatarUrl: 'https://example.com/avatar.jpg',
      kycStatus: 'draft',
      kycRejectionReason: null,
      washMethods: ['waterless'],
      ratingAvg: 0,
      ratingCount: 0,
      acceptanceRate: 100,
      stripeAccountId: null,
      chargesEnabled: false,
      baseAddressId: null,
    };

    it('récupère le profil pro courant avec Authorization', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ data: providerProfile }));
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('provider.jwt'),
      });

      await expect(api.providers.me()).resolves.toEqual(providerProfile);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/me',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer provider.jwt',
          },
        },
      );
    });

    it('met à jour le profil pro courant', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: { ...providerProfile, companyName: 'Clean Auto Pro' },
        }),
      );

      await expect(
        api.providers.updateMe({
          companyName: 'Clean Auto Pro',
          siret: '12345678901234',
          washMethods: ['waterless'],
        }),
      ).resolves.toMatchObject({ companyName: 'Clean Auto Pro' });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/me',
        {
          method: 'PATCH',
          body: JSON.stringify({
            companyName: 'Clean Auto Pro',
            siret: '12345678901234',
            washMethods: ['waterless'],
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it('soumet le dossier KYC provider', async () => {
      const status = {
        status: 'submitted',
        rejectionReason: null,
        documents: [
          {
            id: '33333333-3333-4333-8333-333333333333',
            docType: 'rc_pro',
            fileUrl: 'https://example.com/rc-pro.pdf',
            expiresAt: '2099-12-31',
            verifiedAt: null,
          },
        ],
        rcProAlert: null,
      };
      const dto = {
        siret: '12345678901234',
        washMethods: ['waterless' as const],
        documents: [
          {
            docType: 'rc_pro' as const,
            fileUrl: 'https://example.com/rc-pro.pdf',
            expiresAt: '2099-12-31',
          },
        ],
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: status }));

      await expect(api.providers.submitKyc(dto)).resolves.toEqual(status);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/kyc/submit',
        {
          method: 'POST',
          body: JSON.stringify(dto),
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it('récupère le statut KYC provider', async () => {
      const status = {
        status: 'draft',
        rejectionReason: null,
        documents: [],
        rcProAlert: null,
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: status }));

      await expect(api.providers.kycStatus()).resolves.toEqual(status);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/kyc/status',
        { headers: { 'Content-Type': 'application/json' } },
      );
    });

    it('récupère les alertes RC Pro provider', async () => {
      const response = {
        alert: {
          kind: 'expiring_soon',
          expiresAt: '2026-10-03',
          daysRemaining: 30,
        },
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: response }));

      await expect(api.providers.kycAlerts()).resolves.toEqual(response);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/kyc/alerts',
        { headers: { 'Content-Type': 'application/json' } },
      );
    });

    it('récupère l’éligibilité missions provider avec Authorization', async () => {
      const response = { eligible: true, kycStatus: 'approved' };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: response }));
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('provider.jwt'),
      });

      await expect(api.providers.missionEligibility()).resolves.toEqual(
        response,
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/missions/eligibility',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer provider.jwt',
          },
        },
      );
    });

    it('remonte KYC_NOT_APPROVED depuis l’éligibilité missions', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse(
          {
            error: {
              code: 'KYC_NOT_APPROVED',
              message: "Le dossier KYC n'est pas encore approuvé.",
            },
          },
          { ok: false, status: 403, statusText: 'Forbidden' },
        ),
      );

      await expect(api.providers.missionEligibility()).rejects.toMatchObject({
        name: 'ApiError',
        code: 'KYC_NOT_APPROVED',
        status: 403,
      });
    });

    it('récupère les capabilities provider', async () => {
      const response = {
        capabilities: [
          {
            offerId: '44444444-4444-4444-8444-444444444444',
            offerSlug: 'wash-complete',
            offerName: 'Lavage complet',
            categorySlug: 'wash',
            isActive: true,
          },
        ],
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: response }));

      await expect(api.providers.capabilities()).resolves.toEqual(response);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/capabilities',
        { headers: { 'Content-Type': 'application/json' } },
      );
    });

    it('met à jour les capabilities provider', async () => {
      const dto = {
        offerIds: ['44444444-4444-4444-8444-444444444444'],
      };
      const response = {
        capabilities: [
          {
            offerId: '44444444-4444-4444-8444-444444444444',
            offerSlug: 'wash-complete',
            offerName: 'Lavage complet',
            categorySlug: 'wash',
            isActive: true,
          },
        ],
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: response }));

      await expect(api.providers.updateCapabilities(dto)).resolves.toEqual(
        response,
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/capabilities',
        {
          method: 'PUT',
          body: JSON.stringify(dto),
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it('récupère les disponibilités provider', async () => {
      const response = {
        weeklySlots: [
          {
            id: '77777777-7777-4777-8777-777777777777',
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '12:00',
            isActive: true,
          },
        ],
        blockedSlots: [],
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: response }));

      await expect(api.providers.availability()).resolves.toEqual(response);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/availability',
        { headers: { 'Content-Type': 'application/json' } },
      );
    });

    it('met à jour les disponibilités provider', async () => {
      const dto = {
        weeklySlots: [
          {
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '12:00',
            isActive: true,
          },
        ],
        blockedSlots: [
          {
            startAt: '2026-09-10T09:00:00.000Z',
            endAt: '2026-09-10T12:00:00.000Z',
            reason: 'Congé',
          },
        ],
      };
      const response = {
        weeklySlots: [
          {
            id: '77777777-7777-4777-8777-777777777777',
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '12:00',
            isActive: true,
          },
        ],
        blockedSlots: [
          {
            id: '88888888-8888-4888-8888-888888888888',
            startAt: '2026-09-10T09:00:00.000Z',
            endAt: '2026-09-10T12:00:00.000Z',
            reason: 'Congé',
          },
        ],
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: response }));

      await expect(api.providers.updateAvailability(dto)).resolves.toEqual(
        response,
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/availability',
        {
          method: 'PUT',
          body: JSON.stringify(dto),
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it("récupère les zones d'intervention provider", async () => {
      const response = {
        zones: [
          {
            zoneId: '99999999-9999-4999-8999-999999999999',
            zoneSlug: 'lyon',
            zoneName: 'Lyon',
            radiusKm: 12.5,
          },
        ],
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: response }));

      await expect(api.providers.zones()).resolves.toEqual(response);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/zones',
        { headers: { 'Content-Type': 'application/json' } },
      );
    });

    it("met à jour les zones d'intervention provider", async () => {
      const dto = {
        zones: [
          {
            zoneId: '99999999-9999-4999-8999-999999999999',
            radiusKm: 12.5,
          },
        ],
      };
      const response = {
        zones: [
          {
            zoneId: '99999999-9999-4999-8999-999999999999',
            zoneSlug: 'lyon',
            zoneName: 'Lyon',
            radiusKm: 12.5,
          },
        ],
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: response }));

      await expect(api.providers.updateZones(dto)).resolves.toEqual(response);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/zones',
        {
          method: 'PUT',
          body: JSON.stringify(dto),
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it('crée un lien onboarding Stripe Connect', async () => {
      const dto = {
        returnUrl: 'https://pro.carservice.test/stripe/return',
        refreshUrl: 'https://pro.carservice.test/stripe/refresh',
      };
      const response = {
        url: 'https://connect.stripe.com/setup/s/acct_123',
        stripeAccountId: 'acct_123',
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: response }));

      await expect(
        api.providers.createStripeOnboardingLink(dto),
      ).resolves.toEqual(response);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/stripe/onboard',
        {
          method: 'POST',
          body: JSON.stringify(dto),
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it('envoie le Bearer token pour l’onboarding Stripe', async () => {
      const dto = {
        returnUrl: 'https://pro.carservice.test/stripe/return',
        refreshUrl: 'https://pro.carservice.test/stripe/refresh',
      };
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: {
            url: 'https://connect.stripe.com/setup/s/acct_123',
            stripeAccountId: 'acct_123',
          },
        }),
      );
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('provider.jwt'),
      });

      await api.providers.createStripeOnboardingLink(dto);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/stripe/onboard',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer provider.jwt',
          },
        }),
      );
    });

    it('remonte STRIPE_REQUEST_FAILED depuis l’onboarding Stripe', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse(
          {
            error: {
              code: 'STRIPE_REQUEST_FAILED',
              message: 'Stripe Connect indisponible.',
            },
          },
          { ok: false, status: 503, statusText: 'Service Unavailable' },
        ),
      );

      await expect(
        api.providers.createStripeOnboardingLink({
          returnUrl: 'https://pro.carservice.test/stripe/return',
          refreshUrl: 'https://pro.carservice.test/stripe/refresh',
        }),
      ).rejects.toMatchObject({
        name: 'ApiError',
        code: 'STRIPE_REQUEST_FAILED',
        status: 503,
      });
    });

    it('rejette une réponse onboarding Stripe invalide', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          data: {
            url: 'https://connect.stripe.com/setup/s/acct_123',
            stripeAccountId: '',
          },
        }),
      );

      await expect(
        api.providers.createStripeOnboardingLink({
          returnUrl: 'https://pro.carservice.test/stripe/return',
          refreshUrl: 'https://pro.carservice.test/stripe/refresh',
        }),
      ).rejects.toThrow();
    });
  });

  describe('api.bookings', () => {
    const createDto = {
      offerId: '22222222-2222-4222-8222-222222222222',
      vehicleType: 'suv' as const,
      optionIds: [],
      addressId: '33333333-3333-4333-8333-333333333333',
      slotStart: '2026-09-06T08:00:00.000Z',
      clientPhotoIds: [],
    };

    const createResponse = {
      booking: {
        id: '77777777-7777-4777-8777-777777777777',
        reference: 'CS-20260906-A7B2',
        status: 'payment_authorized' as const,
        pricingSnapshot: {
          base: 8500,
          vehicleSurcharge: 1000,
          options: [],
          serviceFee: 200,
          totalCents: 9700,
          currency: 'EUR' as const,
        },
        slotStart: '2026-09-06T08:00:00.000Z',
        slotEnd: '2026-09-06T09:30:00.000Z',
      },
      payment: {
        clientSecret: 'pi_mock_abc_secret_def',
        paymentIntentId: 'pi_mock_abc',
      },
      matching: { broadcastCount: 2 },
    };

    it('crée un booking et valide la réponse 201', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ data: createResponse }, { status: 201 }),
      );

      await expect(api.bookings.create(createDto)).resolves.toEqual(
        createResponse,
      );
      expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify(createDto),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('envoie le Bearer token pour créer un booking', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ data: createResponse }));
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('client.jwt'),
      });

      await api.bookings.create(createDto);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/bookings',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer client.jwt',
          }),
        }),
      );
    });

    it('accepte une mission et valide l’adresse retournée', async () => {
      const accepted = {
        id: '77777777-7777-4777-8777-777777777777',
        reference: 'CS-20260906-A7B2',
        status: 'accepted' as const,
        slotStart: '2026-09-06T08:00:00.000Z',
        slotEnd: '2026-09-06T09:30:00.000Z',
        offerName: 'Lavage complet',
        totalCents: 9700,
        currency: 'EUR' as const,
        addressSnapshot: {
          street: '12 rue de la République',
          complement: null,
          city: 'Lyon',
          postalCode: '69002',
          country: 'FR',
          lat: 45.764,
          lng: 4.835,
          instructions: null,
        },
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: accepted }));

      await expect(
        api.bookings.accept('77777777-7777-4777-8777-777777777777'),
      ).resolves.toEqual(accepted);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/bookings/77777777-7777-4777-8777-777777777777/accept',
        { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      );
    });

    it('refuse une mission et remonte BOOKING_ALREADY_ACCEPTED', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse(
          {
            error: {
              code: 'BOOKING_ALREADY_ACCEPTED',
              message: 'Cette mission n’est plus disponible.',
            },
          },
          { ok: false, status: 409, statusText: 'Conflict' },
        ),
      );

      await expect(
        api.bookings.decline('77777777-7777-4777-8777-777777777777'),
      ).rejects.toMatchObject({
        name: 'ApiError',
        code: 'BOOKING_ALREADY_ACCEPTED',
        status: 409,
      });
    });

    it('met à jour le statut de mission (en_route)', async () => {
      const updated = {
        id: '77777777-7777-4777-8777-777777777777',
        reference: 'CS-20260906-A7B2',
        status: 'en_route' as const,
        providerNotes: null,
        slotStart: '2026-09-06T08:00:00.000Z',
        slotEnd: '2026-09-06T09:30:00.000Z',
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: updated }));

      await expect(
        api.bookings.updateStatus('77777777-7777-4777-8777-777777777777', {
          status: 'en_route',
        }),
      ).resolves.toEqual(updated);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/bookings/77777777-7777-4777-8777-777777777777/status',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'en_route' }),
        },
      );
    });

    it('annule une réservation (client, fenêtre free)', async () => {
      const cancelled = {
        id: '77777777-7777-4777-8777-777777777777',
        reference: 'CS-20260906-A7B2',
        status: 'cancelled_by_client' as const,
        reason: null,
        window: 'free' as const,
        feeCents: 0,
        refundCents: 9700,
        currency: 'EUR' as const,
        providerPenalty: 0,
        rematchUrgent: false,
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: cancelled }));

      await expect(
        api.bookings.cancel('77777777-7777-4777-8777-777777777777'),
      ).resolves.toEqual(cancelled);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/bookings/77777777-7777-4777-8777-777777777777/cancel',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
    });

    it('récupère les missions disponibles pour un pro', async () => {
      const available = [
        {
          id: '77777777-7777-4777-8777-777777777777',
          reference: 'CS-20260906-A7B2',
          slotStart: '2026-09-06T08:00:00.000Z',
          slotEnd: '2026-09-06T09:30:00.000Z',
          offerName: 'Lavage complet',
          totalCents: 9700,
          currency: 'EUR' as const,
          score: 72.5,
          zone: { slug: 'lyon', name: 'Lyon' },
        },
      ];
      fetchMock.mockResolvedValue(mockFetchResponse({ data: available }));

      await expect(api.bookings.available()).resolves.toEqual(available);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/bookings/available',
        { headers: { 'Content-Type': 'application/json' } },
      );
    });

    it('liste les bookings avec filtre group C12', async () => {
      const items = [
        {
          id: '77777777-7777-4777-8777-777777777777',
          reference: 'CS-20260906-A7B2',
          status: 'accepted' as const,
          slotStart: '2026-09-06T08:00:00.000Z',
          slotEnd: '2026-09-06T09:30:00.000Z',
          offerName: 'Lavage complet',
          vehicleType: 'suv' as const,
          totalCents: 9700,
          currency: 'EUR' as const,
          zone: { slug: 'lyon', name: 'Lyon' },
          addressSnapshot: null,
        },
      ];
      fetchMock.mockResolvedValue(mockFetchResponse({ data: items }));

      await expect(api.bookings.list({ group: 'upcoming' })).resolves.toEqual(
        items,
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/bookings?group=upcoming',
        { headers: { 'Content-Type': 'application/json' } },
      );
    });

    it('récupère le détail booking avec timeline', async () => {
      const detail = {
        id: '77777777-7777-4777-8777-777777777777',
        reference: 'CS-20260906-A7B2',
        status: 'accepted' as const,
        slotStart: '2026-09-06T08:00:00.000Z',
        slotEnd: '2026-09-06T09:30:00.000Z',
        offerName: 'Lavage complet',
        vehicleType: 'suv' as const,
        totalCents: 9700,
        currency: 'EUR' as const,
        zone: { slug: 'lyon', name: 'Lyon' },
        addressSnapshot: {
          street: '12 rue de la République',
          complement: null,
          city: 'Lyon',
          postalCode: '69002',
          country: 'FR',
          lat: 45.764,
          lng: 4.835,
          instructions: null,
        },
        clientComment: 'Parking B2',
        providerNotes: null,
        pricingSnapshot: {
          base: 8500,
          vehicleSurcharge: 1000,
          options: [],
          serviceFee: 200,
          totalCents: 9700,
          currency: 'EUR' as const,
        },
        timeline: [
          {
            fromStatus: null,
            toStatus: 'draft' as const,
            actorType: 'system' as const,
            reason: null,
            createdAt: '2026-09-06T07:00:00.000Z',
          },
        ],
        photos: [],
        provider: {
          companyName: 'Marc Wash',
          avatarUrl: null,
          ratingAvg: 4.8,
          washMethods: ['waterless' as const],
        },
        client: null,
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: detail }));

      await expect(
        api.bookings.get('77777777-7777-4777-8777-777777777777'),
      ).resolves.toEqual(detail);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/bookings/77777777-7777-4777-8777-777777777777',
        { headers: { 'Content-Type': 'application/json' } },
      );
    });

    it('récupère la grille de créneaux C07', async () => {
      const slots = {
        durationMinutes: 90,
        minBookingLeadHours: 2,
        horizonDays: 14 as const,
        zone: { slug: 'lyon', name: 'Lyon' },
        days: [
          {
            date: '2026-09-16',
            slots: [
              {
                start: '2026-09-16T08:00:00.000Z',
                end: '2026-09-16T09:30:00.000Z',
                available: true,
              },
            ],
          },
        ],
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: slots }));

      await expect(
        api.bookings.slots({
          offerId: '22222222-2222-4222-8222-222222222222',
          vehicleType: 'suv',
          optionIds: [],
          addressId: '33333333-3333-4333-8333-333333333333',
        }),
      ).resolves.toEqual(slots);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/bookings/slots',
        {
          method: 'POST',
          body: JSON.stringify({
            offerId: '22222222-2222-4222-8222-222222222222',
            vehicleType: 'suv',
            optionIds: [],
            addressId: '33333333-3333-4333-8333-333333333333',
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it('remonte ZONE_NOT_COVERED depuis la création booking', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse(
          {
            error: {
              code: 'ZONE_NOT_COVERED',
              message: "Cette adresse n'est pas encore couverte.",
            },
          },
          { ok: false, status: 400, statusText: 'Bad Request' },
        ),
      );

      await expect(api.bookings.create(createDto)).rejects.toMatchObject({
        name: 'ApiError',
        code: 'ZONE_NOT_COVERED',
        status: 400,
      });
    });
  });

  describe('api.admin', () => {
    it('récupère le dashboard KPIs', async () => {
      const dashboard = {
        generatedAt: '2026-09-16T12:00:00.000Z',
        gmv: {
          dayCents: 11200,
          weekCents: 11200,
          monthCents: 11200,
          currency: 'EUR' as const,
        },
        gmvLast30Days: [{ date: '2026-09-16', amountCents: 11200 }],
        bookingsByStatus: [{ status: 'completed' as const, count: 1 }],
        providerAcceptanceRateAvg: 100,
        matchingDelayMedianMinutes: 12,
        openDisputes: 0,
        providersPendingKyc: 1,
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: dashboard }));
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('admin.jwt'),
      });

      await expect(api.admin.dashboard()).resolves.toEqual(dashboard);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/admin/dashboard',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer admin.jwt',
          }),
        }),
      );
    });

    it('liste / approve / reject KYC pending', async () => {
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('admin.jwt'),
      });

      fetchMock.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            total: 1,
            items: [
              {
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                companyName: null,
                siret: '12345678901234',
                washMethods: ['waterless'],
                kycStatus: 'submitted',
                submittedAt: '2026-09-16T10:00:00.000Z',
                phone: '+33600000002',
                email: null,
                documents: [
                  {
                    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
                    docType: 'rc_pro',
                    fileUrl: 'https://cdn.example/rc.pdf',
                    expiresAt: '2027-12-31',
                    verifiedAt: null,
                  },
                ],
              },
            ],
          },
        }),
      );
      await expect(api.admin.listPendingProviders()).resolves.toMatchObject({
        total: 1,
      });

      fetchMock.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            providerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            kycStatus: 'approved',
            rejectionReason: null,
          },
        }),
      );
      await expect(
        api.admin.approveProvider('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
      ).resolves.toMatchObject({ kycStatus: 'approved' });

      fetchMock.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            providerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            kycStatus: 'rejected',
            rejectionReason: 'RC Pro illisible',
          },
        }),
      );
      await expect(
        api.admin.rejectProvider('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {
          reason: 'RC Pro illisible',
        }),
      ).resolves.toMatchObject({ kycStatus: 'rejected' });
    });

    it('CRUD catalog admin (offres / options)', async () => {
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('admin.jwt'),
      });

      const category = {
        id: '4e165206-73f4-4987-86dd-eafde885a323',
        slug: 'wash',
        name: 'Lavage auto',
        description: null,
        icon: null,
        isEnabled: true,
        sortOrder: 1,
      };
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse({ data: [category] }),
      );
      await expect(api.admin.listCategories()).resolves.toEqual([category]);

      const offer = {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        categoryId: category.id,
        slug: 'wash-premium',
        name: 'Lavage premium',
        description: null,
        basePriceCents: 12000,
        durationMinutes: 120,
        formSchema: { fields: [] },
        checklistTemplate: { items: [] },
        isActive: true,
        sortOrder: 10,
        category: { slug: 'wash', name: 'Lavage auto' },
        options: [],
      };
      fetchMock.mockResolvedValueOnce(mockFetchResponse({ data: offer }));
      await expect(
        api.admin.createOffer({
          categoryId: category.id,
          slug: 'wash-premium',
          name: 'Lavage premium',
          basePriceCents: 12000,
          durationMinutes: 120,
          formSchema: { fields: [] },
          checklistTemplate: { items: [] },
        }),
      ).resolves.toMatchObject({ slug: 'wash-premium' });

      fetchMock.mockResolvedValueOnce(
        mockFetchResponse({ data: { ...offer, isActive: false } }),
      );
      await expect(
        api.admin.updateOffer(offer.id, { isActive: false }),
      ).resolves.toMatchObject({ isActive: false });
    });

    it('CRUD zones + pricing admin', async () => {
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('admin.jwt'),
      });

      const zone = {
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        name: 'Villeurbanne',
        slug: 'villeurbanne',
        isActive: false,
        priceCoefficient: 1.1,
        minBookingLeadHours: 3,
        polygon: [
          { lat: 45.75, lng: 4.85 },
          { lat: 45.75, lng: 4.9 },
          { lat: 45.8, lng: 4.9 },
          { lat: 45.8, lng: 4.85 },
        ],
        createdAt: '2026-09-16T10:00:00.000Z',
      };
      fetchMock.mockResolvedValueOnce(mockFetchResponse({ data: zone }));
      await expect(
        api.admin.createZone({
          name: 'Villeurbanne',
          slug: 'villeurbanne',
          polygon: zone.polygon,
          isActive: false,
          priceCoefficient: 1.1,
          minBookingLeadHours: 3,
        }),
      ).resolves.toMatchObject({ slug: 'villeurbanne' });

      fetchMock.mockResolvedValueOnce(
        mockFetchResponse({ data: { ...zone, isActive: true } }),
      );
      await expect(
        api.admin.updateZone(zone.id, { isActive: true }),
      ).resolves.toMatchObject({ isActive: true });

      const pricing = {
        zoneId: zone.id,
        offerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        offerSlug: 'wash-complete',
        offerName: 'Lavage complet',
        priceOverrideCents: 9000,
        vehicleSurcharges: {
          citadine: 0,
          berline: 500,
          suv: 1000,
          utilitaire: 1500,
          moto: 0,
        },
      };
      fetchMock.mockResolvedValueOnce(mockFetchResponse({ data: pricing }));
      await expect(
        api.admin.upsertZonePricing(zone.id, pricing.offerId, {
          priceOverrideCents: 9000,
          vehicleSurcharges: pricing.vehicleSurcharges,
        }),
      ).resolves.toMatchObject({ priceOverrideCents: 9000 });
    });

    it('rembourse un booking (admin)', async () => {
      const refunded = {
        bookingId: '77777777-7777-4777-8777-777777777777',
        status: 'cancelled_by_admin' as const,
        paymentStatus: 'refunded' as const,
        refundCents: 9000,
        currency: 'EUR' as const,
        action: 'canceled_authorization' as const,
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: refunded }));

      await expect(
        api.admin.refundBooking('77777777-7777-4777-8777-777777777777', {
          reason: 'Geste commercial',
        }),
      ).resolves.toEqual(refunded);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/admin/bookings/77777777-7777-4777-8777-777777777777/refund',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Geste commercial' }),
        },
      );
    });

    it('liste et détail bookings admin', async () => {
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('admin.jwt'),
      });

      const list = {
        items: [
          {
            id: '77777777-7777-4777-8777-777777777777',
            reference: 'CS-20260916-ABCD',
            status: 'accepted' as const,
            slotStart: '2026-09-20T10:00:00.000Z',
            slotEnd: '2026-09-20T11:30:00.000Z',
            offerName: 'Lavage complet',
            vehicleType: 'suv' as const,
            totalCents: 9500,
            currency: 'EUR' as const,
            zone: { slug: 'lyon', name: 'Lyon' },
            addressSnapshot: {
              street: '1 rue de la République',
              complement: null,
              city: 'Lyon',
              postalCode: '69001',
              country: 'FR',
              lat: 45.764,
              lng: 4.8357,
              instructions: null,
            },
            paymentStatus: 'authorized' as const,
            client: {
              firstName: 'Alice',
              lastName: 'Martin',
              phone: '+33601020304',
            },
            provider: {
              id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
              companyName: 'Pro Wash',
            },
            createdAt: '2026-09-16T08:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      fetchMock.mockResolvedValueOnce(mockFetchResponse({ data: list }));
      await expect(
        api.admin.listBookings({ q: 'CS-2026', status: ['accepted'] }),
      ).resolves.toEqual(list);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/admin/bookings?q=CS-2026&status=accepted',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer admin.jwt',
          }),
        }),
      );

      const detail = {
        ...list.items[0],
        clientComment: null,
        providerNotes: null,
        pricingSnapshot: {
          base: 8500,
          vehicleSurcharge: 1000,
          options: [],
          serviceFee: 0,
          totalCents: 9500,
          currency: 'EUR' as const,
        },
        timeline: [],
        photos: [],
        provider: {
          companyName: 'Pro Wash',
          avatarUrl: null,
          ratingAvg: 4.5,
          washMethods: ['waterless' as const],
        },
        payment: {
          amountCents: 9500,
          commissionCents: 1900,
          providerNetCents: 7600,
          status: 'authorized' as const,
          stripePaymentIntentId: 'pi_mock_1',
        },
      };
      fetchMock.mockResolvedValueOnce(mockFetchResponse({ data: detail }));
      await expect(
        api.admin.getBooking('77777777-7777-4777-8777-777777777777'),
      ).resolves.toMatchObject({ reference: 'CS-20260916-ABCD' });
    });

    it('liste et résout un litige admin', async () => {
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('admin.jwt'),
      });

      const list = {
        items: [
          {
            id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            bookingId: '77777777-7777-4777-8777-777777777777',
            bookingReference: 'CS-20260916-ABCD',
            openedBy: 'client' as const,
            reason: 'quality' as const,
            description: 'Prestation incomplète, traces partout.',
            status: 'open' as const,
            createdAt: '2026-09-16T12:00:00.000Z',
            payoutFrozen: true,
            client: {
              firstName: 'Alice',
              lastName: 'Martin',
              phone: '+33601020304',
            },
            provider: {
              id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
              companyName: 'Pro Wash',
            },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      fetchMock.mockResolvedValueOnce(mockFetchResponse({ data: list }));
      await expect(api.admin.listDisputes()).resolves.toEqual(list);

      const dispute = list.items[0]!;
      const resolved = {
        id: dispute.id,
        bookingId: dispute.bookingId,
        status: 'resolved_client' as const,
        resolutionNotes: 'Remboursement intégral',
        resolvedAt: '2026-09-16T14:00:00.000Z',
        payoutFrozen: false,
        paymentStatus: 'refunded' as const,
        refundCents: 9500,
        paymentAction: 'refunded' as const,
      };
      fetchMock.mockResolvedValueOnce(mockFetchResponse({ data: resolved }));
      await expect(
        api.admin.resolveDispute(dispute.id, {
          decision: 'resolved_client',
          notes: 'Remboursement intégral',
        }),
      ).resolves.toEqual(resolved);
    });

    it('GET/PATCH config plateforme admin', async () => {
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('admin.jwt'),
      });

      const config = {
        commissionRate: 0.2,
        matchingTimeoutT1Minutes: 30,
        matchingTimeoutT2Hours: 2,
        matchingUnassignedLeadHours: 2,
        cancelFreeHours: 24,
        cancelLateHours: 2,
        serviceFeeCents: 0,
        updatedAt: null,
      };
      fetchMock.mockResolvedValueOnce(mockFetchResponse({ data: config }));
      await expect(api.admin.getConfig()).resolves.toEqual(config);

      fetchMock.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            ...config,
            matchingTimeoutT1Minutes: 45,
            updatedAt: '2026-09-16T15:00:00.000Z',
          },
        }),
      );
      await expect(
        api.admin.updateConfig({ matchingTimeoutT1Minutes: 45 }),
      ).resolves.toMatchObject({ matchingTimeoutT1Minutes: 45 });
    });
  });

  describe('api.media', () => {
    it('demande une URL d’upload presignée', async () => {
      const payload = {
        uploadUrl: 'https://cdn.carservice.test/mock-upload/key',
        fileKey: 'bookings/77777777-7777-4777-8777-777777777777/before/id.jpg',
        expiresAt: '2026-09-15T10:15:00.000Z',
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: payload }));
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('client.jwt'),
      });

      await expect(
        api.media.createUploadUrl({
          mimeType: 'image/jpeg',
          context: 'booking_photo',
          bookingId: '77777777-7777-4777-8777-777777777777',
          photoType: 'before',
        }),
      ).resolves.toEqual(payload);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/media/upload-url',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer client.jwt',
          },
          body: JSON.stringify({
            mimeType: 'image/jpeg',
            context: 'booking_photo',
            bookingId: '77777777-7777-4777-8777-777777777777',
            photoType: 'before',
          }),
        },
      );
    });

    it('confirme un upload et attache une booking_photo', async () => {
      const payload = {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        bookingId: '77777777-7777-4777-8777-777777777777',
        photoType: 'before',
        uploadedBy: 'client',
        fileKey: 'bookings/77777777-7777-4777-8777-777777777777/before/id.jpg',
        fileUrl:
          'https://cdn.carservice.test/bookings/77777777-7777-4777-8777-777777777777/before/id.jpg',
        createdAt: '2026-09-15T10:00:00.000Z',
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: payload }));
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('client.jwt'),
      });

      await expect(
        api.media.confirmUpload({
          fileKey:
            'bookings/77777777-7777-4777-8777-777777777777/before/id.jpg',
        }),
      ).resolves.toEqual(payload);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/media/confirm',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer client.jwt',
          },
          body: JSON.stringify({
            fileKey:
              'bookings/77777777-7777-4777-8777-777777777777/before/id.jpg',
          }),
        },
      );
    });
  });

  describe('api.reviews', () => {
    it('crée un avis client et valide la réponse', async () => {
      const payload = {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        bookingId: '77777777-7777-4777-8777-777777777777',
        rating: 5,
        comment: 'Impeccable',
        tags: ['quality', 'punctuality'],
        createdAt: '2026-09-15T21:00:00.000Z',
        provider: { ratingAvg: 5, ratingCount: 1 },
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: payload }));
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('client.jwt'),
      });

      await expect(
        api.reviews.create({
          bookingId: '77777777-7777-4777-8777-777777777777',
          rating: 5,
          comment: 'Impeccable',
          tags: ['quality', 'punctuality'],
        }),
      ).resolves.toEqual(payload);
      expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/v1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer client.jwt',
        },
        body: JSON.stringify({
          bookingId: '77777777-7777-4777-8777-777777777777',
          rating: 5,
          comment: 'Impeccable',
          tags: ['quality', 'punctuality'],
        }),
      });
    });

    it('liste les avis publics d’un pro sans JWT', async () => {
      const payload = {
        provider: {
          id: '33333333-3333-4333-8333-333333333333',
          ratingAvg: 5,
          ratingCount: 1,
        },
        items: [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            rating: 5,
            comment: 'Impeccable',
            tags: ['quality'],
            createdAt: '2026-09-15T21:00:00.000Z',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: payload }));
      initApiClient({ baseUrl: 'http://api.test' });

      await expect(
        api.reviews.listByProvider('33333333-3333-4333-8333-333333333333', {
          page: 1,
          pageSize: 20,
        }),
      ).resolves.toEqual(payload);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/reviews/provider/33333333-3333-4333-8333-333333333333?page=1&pageSize=20',
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });
  });

  describe('api.disputes', () => {
    it('ouvre un litige et gèle le payout', async () => {
      const payload = {
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        bookingId: '77777777-7777-4777-8777-777777777777',
        openedBy: 'client',
        reason: 'quality',
        description: 'Prestation incomplète, traces partout.',
        status: 'open',
        bookingStatus: 'disputed',
        payoutFrozen: true,
        payoutFrozenAt: '2026-09-15T21:00:00.000Z',
        createdAt: '2026-09-15T21:00:00.000Z',
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: payload }));
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('client.jwt'),
      });

      await expect(
        api.disputes.create({
          bookingId: '77777777-7777-4777-8777-777777777777',
          reason: 'quality',
          description: 'Prestation incomplète, traces partout.',
        }),
      ).resolves.toEqual(payload);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/disputes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer client.jwt',
          },
          body: JSON.stringify({
            bookingId: '77777777-7777-4777-8777-777777777777',
            reason: 'quality',
            description: 'Prestation incomplète, traces partout.',
          }),
        },
      );
    });
  });

  describe('api.users', () => {
    it('enregistre un Expo push token', async () => {
      const payload = {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
        platform: 'ios',
        updatedAt: '2026-09-15T22:00:00.000Z',
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: payload }));
      initApiClient({
        baseUrl: 'http://api.test',
        getAccessToken: jest.fn().mockResolvedValue('client.jwt'),
      });

      await expect(
        api.users.registerPushToken({
          token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
          platform: 'ios',
        }),
      ).resolves.toEqual(payload);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/users/push-token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer client.jwt',
          },
          body: JSON.stringify({
            token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
            platform: 'ios',
          }),
        },
      );
    });
  });
});
