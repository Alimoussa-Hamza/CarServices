import {
  AddressSnapshotSchema,
  AuthTokensResponseSchema,
  BOOKING_DISPUTE_WINDOW_HOURS,
  BOOKING_GEOFENCE_METERS,
  BOOKING_MIN_AFTER_PHOTOS,
  BOOKING_MIN_BEFORE_PHOTOS,
  MATCHING_BROADCAST_SIZE,
  MATCHING_RADIUS_EXPAND_FACTOR,
  MATCHING_TIMEOUT_T1_MINUTES,
  MATCHING_TIMEOUT_T2_HOURS,
  MATCHING_UNASSIGNED_LEAD_HOURS,
  CANCEL_FEE_LATE_PERCENT,
  CANCEL_FEE_MID_PERCENT,
  CANCEL_FREE_HOURS,
  CANCEL_LATE_HOURS,
  PLATFORM_COMMISSION_RATE,
  BookingActorTypeSchema,
  BookingPhotoTypeSchema,
  BookingPhotoUploaderSchema,
  BookingReferenceSchema,
  BookingStatusSchema,
  CatalogQuoteResponseSchema,
  PricingSnapshotSchema,
  CatalogQuoteSchema,
  AcceptedBookingSchema,
  CreateBookingResponseSchema,
  CreateBookingSchema,
  DeclineBookingSchema,
  PatchBookingStatusSchema,
  BookingStatusUpdateSchema,
  CancelBookingSchema,
  CancelledBookingSchema,
  ListBookingsQuerySchema,
  resolveBookingListStatuses,
  BookingListItemSchema,
  BookingDetailSchema,
  CreateStripeOnboardingLinkSchema,
  DirtLevelSchema,
  KycDocumentTypeSchema,
  KycStatusResponseSchema,
  KycStatusSchema,
  ProviderKycAlertsResponseSchema,
  RcProAlertSchema,
  OtpRoleSchema,
  OutOfZoneLeadSchema,
  ProviderAvailabilityResponseSchema,
  ProviderCapabilitiesResponseSchema,
  ProviderCapabilitySchema,
  ProviderMissionEligibilitySchema,
  ProviderProfileSchema,
  ProviderZonesResponseSchema,
  SendOtpResponseSchema,
  SendOtpSchema,
  ServiceCategorySchema,
  ServiceOfferSchema,
  StripeOnboardingLinkResponseSchema,
  SubmitKycSchema,
  UpdateProviderAvailabilitySchema,
  UpdateProviderCapabilitiesSchema,
  UpdateProviderProfileSchema,
  UpdateProviderZonesSchema,
  UserRoleSchema,
  VehicleTypeSchema,
  VerifyOtpSchema,
  WashMethodSchema,
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

describe('BookingReferenceSchema', () => {
  it('valide une référence CS-YYYYMMDD-XXXX', () => {
    expect(BookingReferenceSchema.parse('CS-20260906-A7B2')).toBe(
      'CS-20260906-A7B2',
    );
  });

  it('rejette une référence mal formée', () => {
    expect(BookingReferenceSchema.safeParse('CS-2026-ABC').success).toBe(false);
  });
});

describe('BookingActorTypeSchema', () => {
  it('couvre les acteurs de timeline RG-BOOK', () => {
    expect(BookingActorTypeSchema.options).toEqual([
      'client',
      'provider',
      'admin',
      'system',
    ]);
  });
});

describe('BOOKING_DISPUTE_WINDOW_HOURS', () => {
  it('fixe la fenêtre litige à 48 h (RG-BOOK)', () => {
    expect(BOOKING_DISPUTE_WINDOW_HOURS).toBe(48);
  });
});

describe('PLATFORM_COMMISSION_RATE', () => {
  it('fixe la commission plateforme à 20 % (RG-PAY-03)', () => {
    expect(PLATFORM_COMMISSION_RATE).toBe(0.2);
  });
});

describe('MATCHING_BROADCAST_SIZE', () => {
  it('broadcast top 8 (RG-MATCH-03)', () => {
    expect(MATCHING_BROADCAST_SIZE).toBe(8);
  });
});

describe('MATCHING_TIMEOUTS', () => {
  it('fixe T1 30 min, T2 2 h, H-2, rayon ×2 (RG-MATCH-04/05)', () => {
    expect(MATCHING_TIMEOUT_T1_MINUTES).toBe(30);
    expect(MATCHING_TIMEOUT_T2_HOURS).toBe(2);
    expect(MATCHING_UNASSIGNED_LEAD_HOURS).toBe(2);
    expect(MATCHING_RADIUS_EXPAND_FACTOR).toBe(2);
  });
});

describe('CANCEL_*', () => {
  it('fixe la grille RG-CANCEL (24 h / 2 h, 20 % / 50 %)', () => {
    expect(CANCEL_FREE_HOURS).toBe(24);
    expect(CANCEL_LATE_HOURS).toBe(2);
    expect(CANCEL_FEE_MID_PERCENT).toBe(20);
    expect(CANCEL_FEE_LATE_PERCENT).toBe(50);
  });
});

describe('BOOKING_GEOFENCE_METERS / photos min', () => {
  it('fixe la géofence d’arrivée à 200 m (RG-BOOK-03)', () => {
    expect(BOOKING_GEOFENCE_METERS).toBe(200);
  });

  it('exige au moins 1 photo avant et 1 après (RG-BOOK-04)', () => {
    expect(BOOKING_MIN_BEFORE_PHOTOS).toBe(1);
    expect(BOOKING_MIN_AFTER_PHOTOS).toBe(1);
  });
});

describe('CreateBookingSchema', () => {
  const valid = {
    offerId: '22222222-2222-4222-8222-222222222222',
    vehicleType: 'suv',
    addressId: '33333333-3333-4333-8333-333333333333',
    slotStart: '2026-09-06T08:00:00.000Z',
  };

  it('valide une création booking et applique les defaults', () => {
    expect(CreateBookingSchema.parse(valid)).toEqual({
      ...valid,
      optionIds: [],
      clientPhotoIds: [],
    });
  });

  it('rejette un slotStart sans timezone', () => {
    expect(
      CreateBookingSchema.safeParse({
        ...valid,
        slotStart: '2026-09-06T08:00:00',
      }).success,
    ).toBe(false);
  });

  it('rejette un commentaire trop long', () => {
    expect(
      CreateBookingSchema.safeParse({
        ...valid,
        clientComment: 'x'.repeat(301),
      }).success,
    ).toBe(false);
  });
});

describe('DeclineBookingSchema', () => {
  it('accepte un body vide', () => {
    expect(DeclineBookingSchema.parse(undefined)).toEqual({});
    expect(DeclineBookingSchema.parse({})).toEqual({});
  });

  it('accepte un motif optionnel', () => {
    expect(DeclineBookingSchema.parse({ reason: 'Créneau trop tôt' })).toEqual({
      reason: 'Créneau trop tôt',
    });
  });
});

describe('PatchBookingStatusSchema', () => {
  it('accepte en_route sans coordonnées', () => {
    expect(PatchBookingStatusSchema.parse({ status: 'en_route' })).toEqual({
      status: 'en_route',
    });
  });

  it('accepte in_progress avec lat/lng', () => {
    expect(
      PatchBookingStatusSchema.parse({
        status: 'in_progress',
        lat: 45.764,
        lng: 4.8357,
        providerNotes: 'Arrivé, place trouvée',
      }),
    ).toMatchObject({ status: 'in_progress', lat: 45.764, lng: 4.8357 });
  });

  it('rejette lat sans lng', () => {
    expect(
      PatchBookingStatusSchema.safeParse({
        status: 'in_progress',
        lat: 45.764,
      }).success,
    ).toBe(false);
  });

  it('rejette un statut hors graphe pro (cancelled, disputed)', () => {
    expect(
      PatchBookingStatusSchema.safeParse({ status: 'cancelled_by_provider' })
        .success,
    ).toBe(false);
  });
});

describe('BookingStatusUpdateSchema', () => {
  it('valide la réponse de transition', () => {
    expect(
      BookingStatusUpdateSchema.parse({
        id: '77777777-7777-4777-8777-777777777777',
        reference: 'CS-20260906-A7B2',
        status: 'en_route',
        providerNotes: null,
        slotStart: '2026-09-06T08:00:00.000Z',
        slotEnd: '2026-09-06T09:30:00.000Z',
      }),
    ).toMatchObject({ status: 'en_route', providerNotes: null });
  });
});

describe('CancelBookingSchema', () => {
  it('accepte un body vide (client)', () => {
    expect(CancelBookingSchema.parse(undefined)).toEqual({});
    expect(CancelBookingSchema.parse({})).toEqual({});
  });

  it('accepte un motif', () => {
    expect(CancelBookingSchema.parse({ reason: 'Empêchement' })).toEqual({
      reason: 'Empêchement',
    });
  });

  it('rejette un motif trop court', () => {
    expect(CancelBookingSchema.safeParse({ reason: 'no' }).success).toBe(false);
  });
});

describe('CancelledBookingSchema', () => {
  it('valide une annulation client gratuite', () => {
    expect(
      CancelledBookingSchema.parse({
        id: '77777777-7777-4777-8777-777777777777',
        reference: 'CS-20260906-A7B2',
        status: 'cancelled_by_client',
        reason: null,
        window: 'free',
        feeCents: 0,
        refundCents: 9700,
        currency: 'EUR',
        providerPenalty: 0,
        rematchUrgent: false,
      }),
    ).toMatchObject({ window: 'free', feeCents: 0 });
  });
});

describe('ListBookingsQuerySchema', () => {
  it('accepte une query vide', () => {
    expect(ListBookingsQuerySchema.parse({})).toEqual({});
  });

  it('parse status CSV et group C12', () => {
    expect(
      ListBookingsQuerySchema.parse({
        status: 'accepted,en_route',
        group: 'upcoming',
      }),
    ).toEqual({
      status: ['accepted', 'en_route'],
      group: 'upcoming',
    });
  });

  it('rejette un statut inconnu', () => {
    expect(
      ListBookingsQuerySchema.safeParse({ status: 'flying' }).success,
    ).toBe(false);
  });
});

describe('resolveBookingListStatuses', () => {
  it('priorise status sur group', () => {
    expect(
      resolveBookingListStatuses({
        status: ['completed'],
        group: 'upcoming',
      }),
    ).toEqual(['completed']);
  });

  it('mappe les onglets C12', () => {
    expect(resolveBookingListStatuses({ group: 'cancelled' })).toEqual([
      'cancelled_by_client',
      'cancelled_by_provider',
      'cancelled_by_admin',
      'expired',
      'unassigned',
    ]);
    expect(resolveBookingListStatuses({})).toBeUndefined();
  });
});

describe('BookingListItemSchema / BookingDetailSchema', () => {
  const listItem = {
    id: '77777777-7777-4777-8777-777777777777',
    reference: 'CS-20260906-A7B2',
    status: 'pending_provider' as const,
    slotStart: '2026-09-06T08:00:00.000Z',
    slotEnd: '2026-09-06T09:30:00.000Z',
    offerName: 'Lavage complet',
    vehicleType: 'suv' as const,
    totalCents: 9700,
    currency: 'EUR' as const,
    zone: { slug: 'lyon', name: 'Lyon' },
    addressSnapshot: null,
  };

  it('autorise une adresse masquée (RG-SEC-02)', () => {
    expect(BookingListItemSchema.parse(listItem).addressSnapshot).toBeNull();
  });

  it('valide le détail + timeline', () => {
    expect(
      BookingDetailSchema.parse({
        ...listItem,
        status: 'accepted',
        addressSnapshot: {
          street: '12 rue de la République',
          complement: null,
          city: 'Lyon',
          postalCode: '69002',
          country: 'FR',
          lat: 45.76,
          lng: 4.83,
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
          currency: 'EUR',
        },
        timeline: [
          {
            fromStatus: null,
            toStatus: 'draft',
            actorType: 'system',
            reason: null,
            createdAt: '2026-09-06T07:00:00.000Z',
          },
        ],
        photos: [],
        provider: {
          companyName: 'Marc Wash',
          avatarUrl: null,
          ratingAvg: 4.8,
          washMethods: ['waterless'],
        },
        client: null,
      }),
    ).toMatchObject({ status: 'accepted', timeline: [{ toStatus: 'draft' }] });
  });
});

describe('AcceptedBookingSchema', () => {
  it('exige une adresse snapshot (RG-SEC-02)', () => {
    expect(
      AcceptedBookingSchema.parse({
        id: '77777777-7777-4777-8777-777777777777',
        reference: 'CS-20260906-A7B2',
        status: 'accepted',
        slotStart: '2026-09-06T08:00:00.000Z',
        slotEnd: '2026-09-06T09:30:00.000Z',
        offerName: 'Lavage complet',
        totalCents: 9700,
        currency: 'EUR',
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
      }).status,
    ).toBe('accepted');
  });
});

describe('CreateBookingResponseSchema', () => {
  it('valide la réponse 201 du contrat', () => {
    expect(
      CreateBookingResponseSchema.parse({
        booking: {
          id: '77777777-7777-4777-8777-777777777777',
          reference: 'CS-20260906-A7B2',
          status: 'payment_authorized',
          pricingSnapshot: {
            base: 8500,
            vehicleSurcharge: 1000,
            options: [],
            serviceFee: 200,
            totalCents: 9700,
            currency: 'EUR',
          },
          slotStart: '2026-09-06T08:00:00.000Z',
          slotEnd: '2026-09-06T09:30:00.000Z',
        },
        payment: {
          clientSecret: 'pi_mock_abc_secret_def',
          paymentIntentId: 'pi_mock_abc',
        },
        matching: { broadcastCount: 3 },
      }),
    ).toMatchObject({
      booking: { status: 'payment_authorized' },
      matching: { broadcastCount: 3 },
    });
  });
});

describe('BookingPhotoTypeSchema', () => {
  it('couvre before/after/issue', () => {
    expect(BookingPhotoTypeSchema.options).toEqual(['before', 'after', 'issue']);
  });
});

describe('AddressSnapshotSchema', () => {
  it('valide un snapshot adresse de booking', () => {
    expect(
      AddressSnapshotSchema.parse({
        street: '10 rue de la République',
        complement: null,
        city: 'Lyon',
        postalCode: '69001',
        country: 'FR',
        lat: 45.764,
        lng: 4.8357,
        instructions: 'Digicode 12',
        label: 'Domicile',
      }),
    ).toMatchObject({ city: 'Lyon', country: 'FR' });
  });

  it('rejette une latitude impossible', () => {
    expect(
      AddressSnapshotSchema.safeParse({
        street: '10 rue de la République',
        complement: null,
        city: 'Lyon',
        postalCode: '69001',
        country: 'FR',
        lat: 120,
        lng: 4.8357,
        instructions: null,
      }).success,
    ).toBe(false);
  });
});

describe('PricingSnapshotSchema', () => {
  it('valide le snapshot prix figé (RG-CAT-03)', () => {
    expect(
      PricingSnapshotSchema.parse({
        base: 7900,
        vehicleSurcharge: 1500,
        options: [],
        serviceFee: 300,
        totalCents: 9700,
        currency: 'EUR',
      }).totalCents,
    ).toBe(9700);
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

describe('KycStatusSchema', () => {
  it.each(['draft', 'submitted', 'approved', 'rejected'])(
    'accepte le statut KYC %s',
    (status) => {
      expect(KycStatusSchema.parse(status)).toBe(status);
    },
  );
});

describe('KycDocumentTypeSchema', () => {
  it.each(['rc_pro', 'identity', 'other'])(
    'accepte le type de document KYC %s',
    (docType) => {
      expect(KycDocumentTypeSchema.parse(docType)).toBe(docType);
    },
  );
});

describe('WashMethodSchema', () => {
  it('accepte les méthodes de lavage MVP', () => {
    expect(WashMethodSchema.options).toEqual(['waterless', 'steam']);
  });
});

describe('SubmitKycSchema', () => {
  const validDto = {
    siret: '12345678901234',
    washMethods: ['waterless'],
    documents: [
      {
        docType: 'rc_pro',
        fileUrl: 'https://example.com/rc-pro.pdf',
        expiresAt: '2099-12-31',
      },
    ],
  };

  it('valide un dossier KYC conforme RG-KYC-01/RG-KYC-03', () => {
    expect(SubmitKycSchema.parse(validDto)).toEqual(validDto);
  });

  it('rejette un SIRET mal formé', () => {
    expect(SubmitKycSchema.safeParse({ ...validDto, siret: '123' }).success).toBe(
      false,
    );
  });

  it('rejette un dossier sans méthode éco déclarée', () => {
    expect(
      SubmitKycSchema.safeParse({ ...validDto, washMethods: [] }).success,
    ).toBe(false);
  });

  it('rejette un dossier sans RC Pro', () => {
    expect(
      SubmitKycSchema.safeParse({
        ...validDto,
        documents: [{ docType: 'identity', fileUrl: 'https://example.com/id.pdf' }],
      }).success,
    ).toBe(false);
  });

  it('rejette une RC Pro expirée', () => {
    expect(
      SubmitKycSchema.safeParse({
        ...validDto,
        documents: [
          {
            docType: 'rc_pro',
            fileUrl: 'https://example.com/rc-pro.pdf',
            expiresAt: '2000-01-01',
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe('KycStatusResponseSchema', () => {
  it('valide la réponse statut KYC', () => {
    expect(
      KycStatusResponseSchema.parse({
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
      }),
    ).toMatchObject({ status: 'submitted', rcProAlert: null });
  });

  it('valide une alerte RC Pro J-30', () => {
    expect(
      KycStatusResponseSchema.parse({
        status: 'approved',
        rejectionReason: null,
        documents: [],
        rcProAlert: {
          kind: 'expiring_soon',
          expiresAt: '2026-10-03',
          daysRemaining: 30,
        },
      }).rcProAlert,
    ).toEqual({
      kind: 'expiring_soon',
      expiresAt: '2026-10-03',
      daysRemaining: 30,
    });
  });
});

describe('RcProAlertSchema', () => {
  it('valide une alerte expirée avec jours négatifs', () => {
    expect(
      RcProAlertSchema.parse({
        kind: 'expired',
        expiresAt: '2026-09-02',
        daysRemaining: -1,
      }),
    ).toEqual({
      kind: 'expired',
      expiresAt: '2026-09-02',
      daysRemaining: -1,
    });
  });

  it('rejette un kind inconnu', () => {
    expect(
      RcProAlertSchema.safeParse({
        kind: 'soon',
        expiresAt: '2026-10-03',
        daysRemaining: 10,
      }).success,
    ).toBe(false);
  });
});

describe('ProviderKycAlertsResponseSchema', () => {
  it('accepte une absence d’alerte', () => {
    expect(ProviderKycAlertsResponseSchema.parse({ alert: null })).toEqual({
      alert: null,
    });
  });
});

describe('ProviderCapabilitySchema', () => {
  const capability = {
    offerId: '44444444-4444-4444-8444-444444444444',
    offerSlug: 'wash-complete',
    offerName: 'Lavage complet',
    categorySlug: 'wash',
    isActive: true,
  };

  it('valide une capability lavage MVP', () => {
    expect(ProviderCapabilitySchema.parse(capability)).toEqual(capability);
  });

  it('rejette une capability hors catégorie wash', () => {
    expect(
      ProviderCapabilitySchema.safeParse({
        ...capability,
        categorySlug: 'battery',
      }).success,
    ).toBe(false);
  });
});

describe('ProviderCapabilitiesResponseSchema', () => {
  it('valide une liste de capabilities provider', () => {
    expect(
      ProviderCapabilitiesResponseSchema.parse({
        capabilities: [
          {
            offerId: '44444444-4444-4444-8444-444444444444',
            offerSlug: 'wash-complete',
            offerName: 'Lavage complet',
            categorySlug: 'wash',
            isActive: true,
          },
        ],
      }).capabilities,
    ).toHaveLength(1);
  });
});

describe('UpdateProviderCapabilitiesSchema', () => {
  it('valide une mise à jour de capabilities par offerIds', () => {
    expect(
      UpdateProviderCapabilitiesSchema.parse({
        offerIds: ['44444444-4444-4444-8444-444444444444'],
      }),
    ).toEqual({ offerIds: ['44444444-4444-4444-8444-444444444444'] });
  });

  it('rejette une liste vide', () => {
    expect(
      UpdateProviderCapabilitiesSchema.safeParse({ offerIds: [] }).success,
    ).toBe(false);
  });
});

describe('UpdateProviderAvailabilitySchema', () => {
  const validDto = {
    weeklySlots: [
      {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        isActive: true,
      },
      {
        dayOfWeek: 1,
        startTime: '14:00',
        endTime: '18:00',
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

  it('valide des disponibilités hebdomadaires et créneaux bloqués', () => {
    expect(UpdateProviderAvailabilitySchema.parse(validDto)).toEqual(validDto);
  });

  it('rejette une liste de plages hebdomadaires vide', () => {
    expect(
      UpdateProviderAvailabilitySchema.safeParse({ weeklySlots: [] }).success,
    ).toBe(false);
  });

  it('rejette une plage avec endTime avant startTime', () => {
    expect(
      UpdateProviderAvailabilitySchema.safeParse({
        weeklySlots: [
          { dayOfWeek: 2, startTime: '14:00', endTime: '09:00' },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejette deux plages actives qui se chevauchent le même jour', () => {
    expect(
      UpdateProviderAvailabilitySchema.safeParse({
        weeklySlots: [
          { dayOfWeek: 3, startTime: '09:00', endTime: '12:00' },
          { dayOfWeek: 3, startTime: '11:30', endTime: '14:00' },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejette un créneau bloqué avec endAt avant startAt', () => {
    expect(
      UpdateProviderAvailabilitySchema.safeParse({
        weeklySlots: [{ dayOfWeek: 4, startTime: '09:00', endTime: '12:00' }],
        blockedSlots: [
          {
            startAt: '2026-09-10T12:00:00.000Z',
            endAt: '2026-09-10T09:00:00.000Z',
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe('ProviderAvailabilityResponseSchema', () => {
  it('valide la réponse disponibilité provider', () => {
    expect(
      ProviderAvailabilityResponseSchema.parse({
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
            reason: null,
          },
        ],
      }).weeklySlots,
    ).toHaveLength(1);
  });
});

describe('UpdateProviderZonesSchema', () => {
  const zoneId = '99999999-9999-4999-8999-999999999999';

  it('valide une zone provider avec rayon optionnel', () => {
    expect(
      UpdateProviderZonesSchema.parse({
        zones: [{ zoneId, radiusKm: 12.5 }],
      }),
    ).toEqual({ zones: [{ zoneId, radiusKm: 12.5 }] });
  });

  it('rejette une liste vide', () => {
    expect(UpdateProviderZonesSchema.safeParse({ zones: [] }).success).toBe(
      false,
    );
  });

  it('rejette un rayon négatif', () => {
    expect(
      UpdateProviderZonesSchema.safeParse({
        zones: [{ zoneId, radiusKm: -1 }],
      }).success,
    ).toBe(false);
  });

  it('rejette les doublons de zone', () => {
    expect(
      UpdateProviderZonesSchema.safeParse({
        zones: [{ zoneId }, { zoneId }],
      }).success,
    ).toBe(false);
  });
});

describe('ProviderZonesResponseSchema', () => {
  it('valide la réponse zones provider', () => {
    expect(
      ProviderZonesResponseSchema.parse({
        zones: [
          {
            zoneId: '99999999-9999-4999-8999-999999999999',
            zoneSlug: 'lyon',
            zoneName: 'Lyon',
            radiusKm: null,
          },
        ],
      }).zones,
    ).toHaveLength(1);
  });
});

describe('CreateStripeOnboardingLinkSchema', () => {
  it('valide les URLs return/refresh Stripe Connect', () => {
    expect(
      CreateStripeOnboardingLinkSchema.parse({
        returnUrl: 'https://pro.carservice.test/stripe/return',
        refreshUrl: 'https://pro.carservice.test/stripe/refresh',
      }),
    ).toEqual({
      returnUrl: 'https://pro.carservice.test/stripe/return',
      refreshUrl: 'https://pro.carservice.test/stripe/refresh',
    });
  });

  it('rejette une URL invalide', () => {
    expect(
      CreateStripeOnboardingLinkSchema.safeParse({
        returnUrl: 'not-url',
        refreshUrl: 'https://pro.carservice.test/stripe/refresh',
      }).success,
    ).toBe(false);
  });

  it('rejette un refreshUrl manquant', () => {
    expect(
      CreateStripeOnboardingLinkSchema.safeParse({
        returnUrl: 'https://pro.carservice.test/stripe/return',
      }).success,
    ).toBe(false);
  });

  it('rejette un returnUrl manquant', () => {
    expect(
      CreateStripeOnboardingLinkSchema.safeParse({
        refreshUrl: 'https://pro.carservice.test/stripe/refresh',
      }).success,
    ).toBe(false);
  });

  it('rejette un refreshUrl invalide', () => {
    expect(
      CreateStripeOnboardingLinkSchema.safeParse({
        returnUrl: 'https://pro.carservice.test/stripe/return',
        refreshUrl: 'refresh-me',
      }).success,
    ).toBe(false);
  });

  it('rejette un payload vide', () => {
    expect(CreateStripeOnboardingLinkSchema.safeParse({}).success).toBe(false);
  });
});

describe('StripeOnboardingLinkResponseSchema', () => {
  it('valide la réponse de lien onboarding Stripe', () => {
    expect(
      StripeOnboardingLinkResponseSchema.parse({
        url: 'https://connect.stripe.com/setup/s/acct_123',
        stripeAccountId: 'acct_123',
      }),
    ).toEqual({
      url: 'https://connect.stripe.com/setup/s/acct_123',
      stripeAccountId: 'acct_123',
    });
  });

  it('rejette un stripeAccountId vide', () => {
    expect(
      StripeOnboardingLinkResponseSchema.safeParse({
        url: 'https://connect.stripe.com/setup/s/acct_123',
        stripeAccountId: '',
      }).success,
    ).toBe(false);
  });

  it('rejette une url invalide', () => {
    expect(
      StripeOnboardingLinkResponseSchema.safeParse({
        url: 'not-a-url',
        stripeAccountId: 'acct_123',
      }).success,
    ).toBe(false);
  });

  it('rejette une réponse sans url', () => {
    expect(
      StripeOnboardingLinkResponseSchema.safeParse({
        stripeAccountId: 'acct_123',
      }).success,
    ).toBe(false);
  });
});

describe('ProviderMissionEligibilitySchema', () => {
  it('valide un pro éligible aux missions', () => {
    expect(
      ProviderMissionEligibilitySchema.parse({
        eligible: true,
        kycStatus: 'approved',
      }),
    ).toEqual({ eligible: true, kycStatus: 'approved' });
  });

  it('rejette eligible false — l’ineligibilité passe par 403', () => {
    expect(
      ProviderMissionEligibilitySchema.safeParse({
        eligible: false,
        kycStatus: 'draft',
      }).success,
    ).toBe(false);
  });

  it('rejette un kycStatus autre que approved', () => {
    expect(
      ProviderMissionEligibilitySchema.safeParse({
        eligible: true,
        kycStatus: 'submitted',
      }).success,
    ).toBe(false);
  });
});

describe('ProviderProfileSchema', () => {
  const profile = {
    id: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    companyName: 'Clean Auto Lyon',
    siret: '12345678901234',
    bio: 'Lavage écologique à domicile.',
    avatarUrl: 'https://example.com/avatar.jpg',
    kycStatus: 'draft',
    kycRejectionReason: null,
    washMethods: ['waterless'],
    ratingAvg: 4.5,
    ratingCount: 12,
    acceptanceRate: 98.5,
    stripeAccountId: null,
    baseAddressId: null,
  };

  it('valide un profil prestataire', () => {
    expect(ProviderProfileSchema.parse(profile)).toEqual(profile);
  });

  it('rejette une note supérieure à 5', () => {
    expect(
      ProviderProfileSchema.safeParse({ ...profile, ratingAvg: 6 }).success,
    ).toBe(false);
  });

  it('rejette un avatarUrl invalide', () => {
    expect(
      ProviderProfileSchema.safeParse({ ...profile, avatarUrl: 'not-url' })
        .success,
    ).toBe(false);
  });
});

describe('UpdateProviderProfileSchema', () => {
  it('valide les champs éditables par un prestataire', () => {
    expect(
      UpdateProviderProfileSchema.parse({
        companyName: 'Clean Auto Lyon',
        siret: '12345678901234',
        bio: 'Lavage sans eau.',
        avatarUrl: 'https://example.com/avatar.jpg',
        washMethods: ['waterless', 'steam'],
        baseAddressId: null,
      }),
    ).toMatchObject({ companyName: 'Clean Auto Lyon' });
  });

  it('rejette un SIRET mal formé', () => {
    expect(
      UpdateProviderProfileSchema.safeParse({ siret: '123' }).success,
    ).toBe(false);
  });

  it('rejette les champs non éditables comme kycStatus', () => {
    expect(
      UpdateProviderProfileSchema.strict().safeParse({
        companyName: 'Clean Auto Lyon',
        kycStatus: 'approved',
      }).success,
    ).toBe(false);
  });
});
