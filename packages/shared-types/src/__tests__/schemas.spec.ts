import {
  AuthTokensResponseSchema,
  BookingStatusSchema,
  CatalogQuoteResponseSchema,
  CatalogQuoteSchema,
  DirtLevelSchema,
  OtpRoleSchema,
  OutOfZoneLeadSchema,
  SendOtpResponseSchema,
  SendOtpSchema,
  ServiceCategorySchema,
  ServiceOfferSchema,
  UserRoleSchema,
  VehicleTypeSchema,
  VerifyOtpSchema,
  ZoneCheckResponseSchema,
  ZoneCheckSchema,
} from '../index';

describe('UserRoleSchema', () => {
  it.each(['client', 'provider', 'admin'])('accepte le rôle %s', (role) => {
    expect(UserRoleSchema.parse(role)).toBe(role);
  });

  it('rejette un rôle inconnu', () => {
    expect(UserRoleSchema.safeParse('superadmin').success).toBe(false);
  });
});

describe('OtpRoleSchema', () => {
  it('accepte client et provider', () => {
    expect(OtpRoleSchema.parse('client')).toBe('client');
    expect(OtpRoleSchema.parse('provider')).toBe('provider');
  });

  it('rejette admin — pas de connexion OTP pour les admins', () => {
    expect(OtpRoleSchema.safeParse('admin').success).toBe(false);
  });
});

describe('SendOtpSchema', () => {
  it('accepte un numéro français au format E.164', () => {
    const result = SendOtpSchema.parse({
      phone: '+33612345678',
      role: 'client',
    });
    expect(result).toEqual({ phone: '+33612345678', role: 'client' });
  });

  it('rejette un numéro trop court', () => {
    expect(
      SendOtpSchema.safeParse({ phone: '+336123', role: 'client' }).success,
    ).toBe(false);
  });

  it('rejette un numéro trop long', () => {
    expect(
      SendOtpSchema.safeParse({ phone: '+336123456789012345678', role: 'client' })
        .success,
    ).toBe(false);
  });

  it('rejette un rôle admin', () => {
    expect(
      SendOtpSchema.safeParse({ phone: '+33612345678', role: 'admin' }).success,
    ).toBe(false);
  });
});

describe('VerifyOtpSchema', () => {
  const valid = {
    phone: '+33612345678',
    code: '123456',
    acceptTerms: true as const,
  };

  it('accepte un payload complet', () => {
    expect(VerifyOtpSchema.parse(valid)).toEqual(valid);
  });

  it('rejette un code qui ne fait pas 6 caractères', () => {
    expect(VerifyOtpSchema.safeParse({ ...valid, code: '12345' }).success).toBe(
      false,
    );
  });

  it('rejette acceptTerms à false — CGU obligatoires', () => {
    expect(
      VerifyOtpSchema.safeParse({ ...valid, acceptTerms: false }).success,
    ).toBe(false);
  });

  it('rejette acceptTerms absent', () => {
    const { acceptTerms, ...withoutTerms } = valid;
    expect(VerifyOtpSchema.safeParse(withoutTerms).success).toBe(false);
  });
});

describe('SendOtpResponseSchema', () => {
  it('accepte retryAfter null', () => {
    expect(
      SendOtpResponseSchema.parse({ expiresIn: 300, retryAfter: null }),
    ).toEqual({ expiresIn: 300, retryAfter: null });
  });

  it('accepte retryAfter numérique', () => {
    expect(
      SendOtpResponseSchema.parse({ expiresIn: 300, retryAfter: 42 }).retryAfter,
    ).toBe(42);
  });

  it('rejette un expiresIn négatif', () => {
    expect(
      SendOtpResponseSchema.safeParse({ expiresIn: -1, retryAfter: null })
        .success,
    ).toBe(false);
  });
});

describe('AuthTokensResponseSchema', () => {
  const valid = {
    accessToken: 'jwt.access.token',
    refreshToken: 'a'.repeat(64),
    expiresIn: 900,
    user: {
      id: '4e165206-73f4-4987-86dd-eafde885a323',
      role: 'client',
      phone: '+33612345678',
    },
  };

  it('accepte la réponse du contrat API v1', () => {
    expect(AuthTokensResponseSchema.parse(valid)).toEqual(valid);
  });

  it("rejette un id utilisateur qui n'est pas un UUID", () => {
    expect(
      AuthTokensResponseSchema.safeParse({
        ...valid,
        user: { ...valid.user, id: 'not-a-uuid' },
      }).success,
    ).toBe(false);
  });
});

describe('BookingStatusSchema', () => {
  it('couvre les 13 statuts de la state machine RG-BOOK', () => {
    expect(BookingStatusSchema.options).toHaveLength(13);
  });

  it.each([
    'draft',
    'payment_authorized',
    'pending_provider',
    'accepted',
    'en_route',
    'in_progress',
    'completed',
    'cancelled_by_client',
    'cancelled_by_provider',
    'cancelled_by_admin',
    'expired',
    'unassigned',
    'disputed',
  ])('accepte le statut %s', (status) => {
    expect(BookingStatusSchema.parse(status)).toBe(status);
  });

  it('rejette un statut inconnu', () => {
    expect(BookingStatusSchema.safeParse('refunded').success).toBe(false);
  });
});

describe('VehicleTypeSchema', () => {
  it('couvre les types de véhicules du catalogue MVP', () => {
    expect(VehicleTypeSchema.options).toEqual([
      'citadine',
      'berline',
      'suv',
      'utilitaire',
      'moto',
    ]);
  });
});

describe('DirtLevelSchema', () => {
  it('couvre les niveaux de saleté du formulaire quote', () => {
    expect(DirtLevelSchema.options).toEqual(['light', 'normal', 'heavy']);
  });
});

describe('ServiceCategorySchema', () => {
  it('valide une catégorie catalogue', () => {
    expect(
      ServiceCategorySchema.parse({
        id: '4e165206-73f4-4987-86dd-eafde885a323',
        slug: 'wash',
        name: 'Lavage auto',
        description: 'Lavage écologique à domicile.',
        icon: 'sparkles',
      }),
    ).toMatchObject({ slug: 'wash' });
  });

  it('rejette un id invalide', () => {
    expect(
      ServiceCategorySchema.safeParse({
        id: 'bad-id',
        slug: 'wash',
        name: 'Lavage auto',
        description: null,
        icon: null,
      }).success,
    ).toBe(false);
  });
});

describe('ServiceOfferSchema', () => {
  const offer = {
    id: '4e165206-73f4-4987-86dd-eafde885a323',
    slug: 'wash-complete',
    name: 'Lavage complet',
    description: 'Intérieur et extérieur.',
    basePriceCents: 8500,
    durationMinutes: 90,
    category: { slug: 'wash', name: 'Lavage auto' },
    options: [
      {
        id: '779a46b4-4f86-4025-85d8-c66c42eeddef',
        slug: 'pet-hair',
        name: 'Poils animaux',
        priceDeltaCents: 1500,
        durationDeltaMinutes: 15,
      },
    ],
  };

  it('valide une offre avec options', () => {
    expect(ServiceOfferSchema.parse(offer)).toEqual(offer);
  });

  it('rejette un prix négatif', () => {
    expect(
      ServiceOfferSchema.safeParse({ ...offer, basePriceCents: -1 }).success,
    ).toBe(false);
  });
});

describe('CatalogQuoteSchema', () => {
  it('valide une demande de quote et applique les defaults', () => {
    const result = CatalogQuoteSchema.parse({
      offerId: '4e165206-73f4-4987-86dd-eafde885a323',
      vehicleType: 'suv',
      zoneSlug: 'lyon',
    });

    expect(result).toEqual({
      offerId: '4e165206-73f4-4987-86dd-eafde885a323',
      vehicleType: 'suv',
      optionIds: [],
      zoneSlug: 'lyon',
      dirtLevel: 'normal',
    });
  });

  it('rejette une latitude masquée dans un champ offerId invalide', () => {
    expect(
      CatalogQuoteSchema.safeParse({
        offerId: 'not-a-uuid',
        vehicleType: 'suv',
        zoneSlug: 'lyon',
      }).success,
    ).toBe(false);
  });
});

describe('CatalogQuoteResponseSchema', () => {
  it('valide le détail de prix du contrat API', () => {
    expect(
      CatalogQuoteResponseSchema.parse({
        breakdown: {
          base: 8500,
          vehicleSurcharge: 1000,
          options: [
            {
              id: '779a46b4-4f86-4025-85d8-c66c42eeddef',
              name: 'Poils animaux',
              amount: 1500,
            },
          ],
          serviceFee: 200,
          totalCents: 11200,
          currency: 'EUR',
        },
        durationMinutes: 105,
      }).breakdown.totalCents,
    ).toBe(11200);
  });
});

describe('ZoneCheckSchema', () => {
  it('valide un point GPS Lyon', () => {
    expect(
      ZoneCheckSchema.parse({ lat: 45.764, lng: 4.835, postalCode: '69002' }),
    ).toEqual({ lat: 45.764, lng: 4.835, postalCode: '69002' });
  });

  it('rejette une latitude impossible', () => {
    expect(ZoneCheckSchema.safeParse({ lat: 120, lng: 4.835 }).success).toBe(
      false,
    );
  });
});

describe('ZoneCheckResponseSchema', () => {
  it('valide une réponse couverte', () => {
    expect(
      ZoneCheckResponseSchema.parse({
        covered: true,
        zone: {
          id: '4e165206-73f4-4987-86dd-eafde885a323',
          name: 'Lyon',
          slug: 'lyon',
        },
      }).covered,
    ).toBe(true);
  });

  it('valide une réponse hors zone', () => {
    expect(
      ZoneCheckResponseSchema.parse({
        covered: false,
        leadCaptured: false,
      }).covered,
    ).toBe(false);
  });
});

describe('OutOfZoneLeadSchema', () => {
  it('valide un lead hors zone', () => {
    expect(
      OutOfZoneLeadSchema.parse({
        email: 'client@example.com',
        lat: 44.0,
        lng: 4.0,
        addressText: 'Adresse non couverte',
      }),
    ).toMatchObject({ email: 'client@example.com' });
  });

  it('rejette une adresse trop courte', () => {
    expect(
      OutOfZoneLeadSchema.safeParse({
        email: 'client@example.com',
        lat: 44.0,
        lng: 4.0,
        addressText: 'abc',
      }).success,
    ).toBe(false);
  });
});
