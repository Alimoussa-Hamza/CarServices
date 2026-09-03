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
      };
      fetchMock.mockResolvedValue(mockFetchResponse({ data: status }));

      await expect(api.providers.kycStatus()).resolves.toEqual(status);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/v1/providers/kyc/status',
        { headers: { 'Content-Type': 'application/json' } },
      );
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
  });
});
