import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import { CatalogService } from '../../catalog/catalog.service';
import { PaymentsService } from '../../payments/payments.service';
import { RedisService } from '../../redis/redis.service';
import { ZonesService } from '../../zones/zones.service';
import { BookingMatchingService } from '../booking-matching.service';
import { BookingStateMachine } from '../booking-state.machine';
import { BookingsService } from '../bookings.service';
import { MatchingQueueService } from '../matching-queue.service';
import { PrismaService } from '../../../prisma/prisma.service';

const userId = '11111111-1111-4111-8111-111111111111';
const clientId = '22222222-2222-4222-8222-222222222222';
const addressId = '33333333-3333-4333-8333-333333333333';
const offerId = '44444444-4444-4444-8444-444444444444';
const optionId = '55555555-5555-4555-8555-555555555555';
const zoneId = '66666666-6666-4666-8666-666666666666';
const bookingId = '77777777-7777-4777-8777-777777777777';
const providerId = '88888888-8888-4888-8888-888888888888';

const dto = {
  offerId,
  vehicleType: 'suv' as const,
  optionIds: [optionId],
  addressId,
  slotStart: '2026-09-13T14:00:00.000Z',
  clientComment: 'Parking B2',
  clientPhotoIds: [],
};

const address = {
  id: addressId,
  userId,
  label: 'Maison',
  street: '12 rue de la République',
  complement: null,
  city: 'Lyon',
  postalCode: '69002',
  country: 'FR',
  lat: 45.764,
  lng: 4.835,
  instructions: 'Digicode 12',
};

const quote = {
  breakdown: {
    base: 8500,
    vehicleSurcharge: 1000,
    options: [{ id: optionId, name: 'Poils animaux', amount: 1500 }],
    serviceFee: 200,
    totalCents: 11200,
    currency: 'EUR' as const,
  },
  durationMinutes: 105,
  offer: {
    id: offerId,
    name: 'Lavage complet',
    categorySlug: 'wash',
  },
};

const now = new Date('2026-09-13T10:00:00.000Z');

function buildService() {
  const prisma = {
    clientProfile: { upsert: jest.fn(), findUnique: jest.fn() },
    address: { findFirst: jest.fn() },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    bookingStatusHistory: { create: jest.fn() },
    bookingBroadcast: { findFirst: jest.fn() },
    providerProfile: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
  );

  const catalogService = {
    computeQuote: jest.fn().mockResolvedValue(quote),
  };
  const zonesService = {
    findCoveringZone: jest.fn().mockResolvedValue({
      id: zoneId,
      name: 'Lyon',
      slug: 'lyon',
      minBookingLeadHours: 2,
    }),
  };
  const config = {
    get: jest.fn().mockReturnValue(undefined),
  };
  const matchingService = {
    broadcast: jest.fn().mockResolvedValue({
      broadcastCount: 2,
      status: 'pending_provider',
    }),
    tryClaim: jest.fn(),
    decline: jest.fn(),
  };
  const matchingQueue = {
    scheduleTimeouts: jest.fn().mockResolvedValue(undefined),
  };
  const redis = {
    client: { lpush: jest.fn().mockResolvedValue(1) },
  };
  const paymentsService = {
    authorizeBooking: jest.fn().mockResolvedValue({
      paymentIntentId: 'pi_mock_abc123',
      clientSecret: 'pi_mock_abc123_secret_def',
      amountCents: 11200,
      commissionCents: 2240,
      providerNetCents: 8960,
      currency: 'EUR',
    }),
  };

  prisma.clientProfile.upsert.mockResolvedValue({ id: clientId, userId });
  prisma.address.findFirst.mockResolvedValue(address);
  prisma.booking.create.mockResolvedValue({
    id: bookingId,
    reference: 'CS-20260913-A7B2',
    status: 'payment_authorized',
    slotStart: new Date(dto.slotStart),
    slotEnd: new Date('2026-09-13T15:45:00.000Z'),
  });

  return {
    service: new BookingsService(
      prisma as unknown as PrismaService,
      catalogService as unknown as CatalogService,
      zonesService as unknown as ZonesService,
      new BookingStateMachine(),
      matchingService as unknown as BookingMatchingService,
      matchingQueue as unknown as MatchingQueueService,
      redis as unknown as RedisService,
      config as unknown as ConfigService,
      paymentsService as unknown as PaymentsService,
    ),
    prisma,
    catalogService,
    zonesService,
    matchingService,
    matchingQueue,
    redis,
    paymentsService,
  };
}

describe('BookingsService.create', () => {
  it('crée un booking avec snapshots figés et PaymentIntent (RG-PAY-01)', async () => {
    const {
      service,
      prisma,
      catalogService,
      zonesService,
      matchingService,
      matchingQueue,
      paymentsService,
    } = buildService();

    const result = await service.create(userId, dto, now);

    expect(result.data.booking).toMatchObject({
      id: bookingId,
      reference: 'CS-20260913-A7B2',
      status: 'pending_provider',
      pricingSnapshot: quote.breakdown,
      slotStart: '2026-09-13T14:00:00.000Z',
      slotEnd: '2026-09-13T15:45:00.000Z',
    });
    expect(result.data.matching).toEqual({ broadcastCount: 2 });
    expect(matchingService.broadcast).toHaveBeenCalledWith(bookingId, now);
    expect(matchingQueue.scheduleTimeouts).toHaveBeenCalledWith(
      bookingId,
      new Date(dto.slotStart),
      now,
    );
    expect(paymentsService.authorizeBooking).toHaveBeenCalledWith({
      amountCents: 11200,
      commissionRate: 0.2,
      metadata: { clientId, zoneSlug: 'lyon' },
    });
    expect(result.data.payment).toEqual({
      paymentIntentId: 'pi_mock_abc123',
      clientSecret: 'pi_mock_abc123_secret_def',
    });
    expect(zonesService.findCoveringZone).toHaveBeenCalledWith(45.764, 4.835);
    expect(catalogService.computeQuote).toHaveBeenCalledWith({
      offerId,
      vehicleType: 'suv',
      optionIds: [optionId],
      zoneSlug: 'lyon',
      dirtLevel: 'normal',
    });

    const createData = prisma.booking.create.mock.calls[0][0].data;
    expect(createData.status).toBe('payment_authorized');
    expect(createData.addressSnapshot).toEqual({
      street: '12 rue de la République',
      complement: null,
      city: 'Lyon',
      postalCode: '69002',
      country: 'FR',
      lat: 45.764,
      lng: 4.835,
      instructions: 'Digicode 12',
      label: 'Maison',
    });
    expect(createData.pricingSnapshot).toEqual(quote.breakdown);
    expect(createData.commissionRate.toNumber()).toBe(0.2);
    expect(createData.items.create).toMatchObject({
      offerId,
      offerName: 'Lavage complet',
      vehicleType: 'suv',
      unitPriceCents: 11000,
      totalPriceCents: 11200,
    });
    expect(createData.payment.create).toEqual({
      stripePaymentIntentId: 'pi_mock_abc123',
      amountCents: 11200,
      commissionCents: 2240,
      providerNetCents: 8960,
      currency: 'EUR',
      status: 'authorized',
    });
    expect(createData.history.create).toEqual([
      { fromStatus: null, toStatus: 'draft', actorType: 'system' },
      {
        fromStatus: 'draft',
        toStatus: 'payment_authorized',
        actorType: 'system',
      },
    ]);
  });

  it('n’enregistre pas le booking si la pré-auth Stripe échoue (RG-PAY-06)', async () => {
    const { service, prisma, matchingService, paymentsService } = buildService();
    paymentsService.authorizeBooking.mockRejectedValue(
      new ServiceUnavailableException({
        code: 'STRIPE_REQUEST_FAILED',
        message: 'Stripe indisponible.',
        details: [],
      }),
    );

    await expect(service.create(userId, dto, now)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.booking.create).not.toHaveBeenCalled();
    expect(matchingService.broadcast).not.toHaveBeenCalled();
  });

  it('rejette une adresse inconnue ou d’un autre user', async () => {
    const { service, prisma } = buildService();
    prisma.address.findFirst.mockResolvedValue(null);

    await expect(service.create(userId, dto, now)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejette une adresse hors zone (RG-ZONE-01)', async () => {
    const { service, zonesService } = buildService();
    zonesService.findCoveringZone.mockResolvedValue(null);

    await expect(service.create(userId, dto, now)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejette un créneau trop proche (minBookingLeadHours)', async () => {
    const { service } = buildService();

    await expect(
      service.create(
        userId,
        { ...dto, slotStart: '2026-09-13T11:30:00.000Z' },
        now,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('relance si la référence collisionne (P2002)', async () => {
    const { service, prisma } = buildService();
    const conflict = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '6.6.0' },
    );
    prisma.booking.create
      .mockRejectedValueOnce(conflict)
      .mockResolvedValueOnce({
        id: bookingId,
        reference: 'CS-20260913-B8C3',
        status: 'payment_authorized',
        slotStart: new Date(dto.slotStart),
        slotEnd: new Date('2026-09-13T15:45:00.000Z'),
      });

    const result = await service.create(userId, dto, now);

    expect(result.data.booking.reference).toBe('CS-20260913-B8C3');
    expect(prisma.booking.create).toHaveBeenCalledTimes(2);
  });
});

describe('BookingsService.accept / decline', () => {
  it('expose l’adresse exacte après accept (RG-SEC-02)', async () => {
    const { service, matchingService } = buildService();
    matchingService.tryClaim.mockResolvedValue({
      id: bookingId,
      reference: 'CS-20260913-A7B2',
      status: 'accepted',
      categorySlug: 'wash',
      slotStart: new Date(dto.slotStart),
      slotEnd: new Date('2026-09-13T15:45:00.000Z'),
      addressSnapshot: {
        street: '12 rue de la République',
        complement: null,
        city: 'Lyon',
        postalCode: '69002',
        country: 'FR',
        lat: 45.764,
        lng: 4.835,
        instructions: 'Digicode 12',
        label: 'Maison',
      },
      pricingSnapshot: quote.breakdown,
      items: [{ offerName: 'Lavage complet' }],
    });

    const result = await service.accept(userId, bookingId);

    expect(result.data).toMatchObject({
      id: bookingId,
      status: 'accepted',
      offerName: 'Lavage complet',
      totalCents: 11200,
      addressSnapshot: { street: '12 rue de la République' },
    });
    expect(matchingService.tryClaim).toHaveBeenCalledWith(bookingId, userId);
  });

  it('délègue le refus au matching', async () => {
    const { service, matchingService } = buildService();
    matchingService.decline.mockResolvedValue({
      declined: true,
      bookingId,
      remainingBroadcasts: 1,
    });

    await expect(service.decline(userId, bookingId)).resolves.toEqual({
      data: { declined: true, bookingId, remainingBroadcasts: 1 },
    });
  });
});

const addressSnapshot = {
  street: '12 rue de la République',
  complement: null,
  city: 'Lyon',
  postalCode: '69002',
  country: 'FR',
  lat: 45.764,
  lng: 4.835,
  instructions: 'Digicode 12',
  label: 'Maison',
};

function assignedBooking(status: string, photos: unknown[] = []) {
  return {
    id: bookingId,
    reference: 'CS-20260913-A7B2',
    status,
    providerId,
    providerNotes: null,
    slotStart: new Date(dto.slotStart),
    slotEnd: new Date('2026-09-13T15:45:00.000Z'),
    addressSnapshot,
    photos,
  };
}

describe('BookingsService.updateStatus', () => {
  it('passe accepted → en_route (RG-BOOK-02)', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({
      id: providerId,
      userId,
    });
    prisma.booking.findUnique.mockResolvedValue(assignedBooking('accepted'));
    prisma.booking.update.mockResolvedValue({
      ...assignedBooking('en_route'),
      providerNotes: 'Je pars',
    });

    const result = await service.updateStatus(userId, bookingId, {
      status: 'en_route',
      providerNotes: 'Je pars',
    });

    expect(result.data.status).toBe('en_route');
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'en_route',
          providerNotes: 'Je pars',
        }),
      }),
    );
    expect(prisma.bookingStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: 'accepted',
          toStatus: 'en_route',
          actorType: 'provider',
        }),
      }),
    );
  });

  it('refuse un saut accepted → completed (RG-BOOK-01)', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({
      id: providerId,
      userId,
    });
    prisma.booking.findUnique.mockResolvedValue(assignedBooking('accepted'));

    await expect(
      service.updateStatus(userId, bookingId, { status: 'completed' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuse in_progress hors géofence si coords fournies (RG-BOOK-03)', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({
      id: providerId,
      userId,
    });
    prisma.booking.findUnique.mockResolvedValue(assignedBooking('en_route'));

    await expect(
      service.updateStatus(userId, bookingId, {
        status: 'in_progress',
        lat: 48.8566,
        lng: 2.3522,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    try {
      await service.updateStatus(userId, bookingId, {
        status: 'in_progress',
        lat: 48.8566,
        lng: 2.3522,
      });
    } catch (error) {
      expect((error as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({ code: 'BOOKING_GEOFENCE_FAILED' }),
      );
    }
  });

  it('accepte in_progress sans coords (géofence optionnelle)', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({
      id: providerId,
      userId,
    });
    prisma.booking.findUnique.mockResolvedValue(assignedBooking('en_route'));
    prisma.booking.update.mockResolvedValue(assignedBooking('in_progress'));

    const result = await service.updateStatus(userId, bookingId, {
      status: 'in_progress',
    });

    expect(result.data.status).toBe('in_progress');
  });

  it('refuse completed sans photos min (RG-BOOK-04)', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({
      id: providerId,
      userId,
    });
    prisma.booking.findUnique.mockResolvedValue(
      assignedBooking('in_progress', []),
    );

    await expect(
      service.updateStatus(userId, bookingId, { status: 'completed' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    try {
      await service.updateStatus(userId, bookingId, { status: 'completed' });
    } catch (error) {
      expect((error as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({ code: 'BOOKING_PHOTOS_REQUIRED' }),
      );
    }
  });

  it('clôture si photos before/after du pro', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({
      id: providerId,
      userId,
    });
    prisma.booking.findUnique.mockResolvedValue(
      assignedBooking('in_progress', [
        { photoType: 'before', uploadedBy: 'provider' },
        { photoType: 'after', uploadedBy: 'provider' },
      ]),
    );
    prisma.booking.update.mockResolvedValue(assignedBooking('completed'));

    const result = await service.updateStatus(userId, bookingId, {
      status: 'completed',
    });

    expect(result.data.status).toBe('completed');
  });

  it('interdit un pro non assigné', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({
      id: providerId,
      userId,
    });
    prisma.booking.findUnique.mockResolvedValue({
      ...assignedBooking('accepted'),
      providerId: '99999999-9999-4999-8999-999999999999',
    });

    await expect(
      service.updateStatus(userId, bookingId, { status: 'en_route' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('404 si booking inconnu', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({
      id: providerId,
      userId,
    });
    prisma.booking.findUnique.mockResolvedValue(null);

    await expect(
      service.updateStatus(userId, bookingId, { status: 'en_route' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('BookingsService.cancel', () => {
  const pendingBooking = {
    id: bookingId,
    reference: 'CS-20260913-A7B2',
    status: 'pending_provider',
    clientId,
    providerId: null,
    slotStart: new Date('2026-09-20T14:00:00.000Z'),
    pricingSnapshot: quote.breakdown,
    client: { id: clientId, userId },
    provider: null,
  };

  it('annule gratuitement un client > 24 h (RG-CANCEL)', async () => {
    const { service, prisma, redis } = buildService();
    prisma.booking.findUnique.mockResolvedValue(pendingBooking);
    prisma.booking.update.mockResolvedValue({
      ...pendingBooking,
      status: 'cancelled_by_client',
    });

    const result = await service.cancel(
      userId,
      UserRole.client,
      bookingId,
      {},
      now,
    );

    expect(result.data).toMatchObject({
      status: 'cancelled_by_client',
      window: 'free',
      feeCents: 0,
      refundCents: 11200,
      providerPenalty: 0,
      rematchUrgent: false,
    });
    expect(redis.client.lpush).toHaveBeenCalledWith(
      'notifications:push',
      expect.stringContaining('booking.cancelled'),
    );
  });

  it('applique 20 % de frais entre 2 et 24 h', async () => {
    const { service, prisma } = buildService();
    prisma.booking.findUnique.mockResolvedValue({
      ...pendingBooking,
      slotStart: new Date('2026-09-13T20:00:00.000Z'),
    });
    prisma.booking.update.mockResolvedValue({
      ...pendingBooking,
      status: 'cancelled_by_client',
    });

    const result = await service.cancel(
      userId,
      UserRole.client,
      bookingId,
      { reason: 'Changement de plan' },
      now,
    );

    expect(result.data.window).toBe('mid');
    expect(result.data.feeCents).toBe(2240);
    expect(result.data.refundCents).toBe(8960);
  });

  it('refuse l’annulation client après in_progress (RG-CANCEL-02)', async () => {
    const { service, prisma } = buildService();
    prisma.booking.findUnique.mockResolvedValue({
      ...pendingBooking,
      status: 'in_progress',
      providerId,
      provider: { id: providerId, userId: providerId, acceptanceRate: 95 },
    });

    await expect(
      service.cancel(userId, UserRole.client, bookingId, {}),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('exige un motif côté pro (RG-CANCEL-01)', async () => {
    const { service, prisma } = buildService();
    prisma.booking.findUnique.mockResolvedValue({
      ...pendingBooking,
      status: 'accepted',
      providerId,
      provider: { id: providerId, userId, acceptanceRate: 95 },
    });

    await expect(
      service.cancel(userId, UserRole.provider, bookingId, {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('annule côté pro avec pénalité late + rematch urgent', async () => {
    const { service, prisma, redis } = buildService();
    prisma.booking.findUnique.mockResolvedValue({
      ...pendingBooking,
      status: 'accepted',
      providerId,
      provider: { id: providerId, userId, acceptanceRate: 95 },
      slotStart: new Date('2026-09-13T11:00:00.000Z'),
    });
    prisma.booking.update.mockResolvedValue({
      ...pendingBooking,
      status: 'cancelled_by_provider',
    });

    const result = await service.cancel(
      userId,
      UserRole.provider,
      bookingId,
      { reason: 'Panne véhicule' },
      now,
    );

    expect(result.data).toMatchObject({
      status: 'cancelled_by_provider',
      window: 'late',
      feeCents: 0,
      refundCents: 11200,
      providerPenalty: 5,
      rematchUrgent: true,
    });
    expect(prisma.providerProfile.update).toHaveBeenCalled();
    expect(redis.client.lpush).toHaveBeenCalledWith(
      'notifications:push',
      expect.stringContaining('booking.rematch_urgent'),
    );
  });
});

const listRow = {
  id: bookingId,
  reference: 'CS-20260913-A7B2',
  status: 'accepted' as const,
  slotStart: new Date('2026-09-20T14:00:00.000Z'),
  slotEnd: new Date('2026-09-20T15:45:00.000Z'),
  categorySlug: 'wash',
  addressSnapshot: {
    street: '12 rue de la République',
    complement: null,
    city: 'Lyon',
    postalCode: '69002',
    country: 'FR',
    lat: 45.764,
    lng: 4.835,
    instructions: 'Digicode 12',
  },
  pricingSnapshot: quote.breakdown,
  items: [{ offerName: 'Lavage complet', vehicleType: 'suv' as const }],
  zone: { slug: 'lyon', name: 'Lyon' },
};

describe('BookingsService.list', () => {
  it('liste les bookings du client hors draft', async () => {
    const { service, prisma } = buildService();
    prisma.clientProfile.findUnique.mockResolvedValue({ id: clientId, userId });
    prisma.booking.findMany.mockResolvedValue([listRow]);

    await expect(
      service.list(userId, UserRole.client, {}),
    ).resolves.toEqual({
      data: [
        expect.objectContaining({
          id: bookingId,
          status: 'accepted',
          offerName: 'Lavage complet',
          addressSnapshot: expect.objectContaining({ city: 'Lyon' }),
        }),
      ],
    });
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId, status: { not: 'draft' } },
        take: 50,
      }),
    );
  });

  it('filtre par group upcoming pour le pro assigné', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({ id: providerId, userId });
    prisma.booking.findMany.mockResolvedValue([]);

    await service.list(userId, UserRole.provider, { group: 'upcoming' });

    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          providerId,
          status: {
            in: [
              'payment_authorized',
              'pending_provider',
              'accepted',
              'en_route',
              'in_progress',
            ],
          },
        },
      }),
    );
  });
});

describe('BookingsService.getById', () => {
  const detailRow = {
    ...listRow,
    clientComment: 'Parking B2',
    providerNotes: null,
    history: [
      {
        fromStatus: null,
        toStatus: 'draft',
        actorType: 'system' as const,
        reason: null,
        createdAt: new Date('2026-09-13T10:00:00.000Z'),
      },
    ],
    photos: [],
    client: {
      userId,
      firstName: 'Ada',
      lastName: 'Lovelace',
      user: { phone: '+33601000000' },
    },
    provider: {
      id: providerId,
      userId: '88888888-8888-4888-8888-888888888888',
      companyName: 'Marc Wash',
      avatarUrl: null,
      ratingAvg: 4.8,
      washMethods: ['waterless' as const],
    },
    providerId,
  };

  it('renvoie timeline + adresse au client propriétaire', async () => {
    const { service, prisma } = buildService();
    prisma.booking.findUnique.mockResolvedValue(detailRow);

    const result = await service.getById(userId, UserRole.client, bookingId);

    expect(result.data.timeline).toHaveLength(1);
    expect(result.data.addressSnapshot?.street).toContain('République');
    expect(result.data.provider).toMatchObject({ companyName: 'Marc Wash' });
    expect(result.data.client).toBeNull();
  });

  it('masque l’adresse au pro broadcast (RG-SEC-02)', async () => {
    const { service, prisma } = buildService();
    prisma.booking.findUnique.mockResolvedValue({
      ...detailRow,
      status: 'pending_provider',
      providerId: null,
      provider: null,
    });
    prisma.bookingBroadcast.findFirst.mockResolvedValue({ id: 'b1' });

    const result = await service.getById(
      '88888888-8888-4888-8888-888888888888',
      UserRole.provider,
      bookingId,
    );

    expect(result.data.addressSnapshot).toBeNull();
    expect(result.data.client).toBeNull();
    expect(result.data.clientComment).toBe('Parking B2');
  });

  it('révèle adresse + tel client au pro assigné', async () => {
    const { service, prisma } = buildService();
    prisma.booking.findUnique.mockResolvedValue(detailRow);

    const result = await service.getById(
      '88888888-8888-4888-8888-888888888888',
      UserRole.provider,
      bookingId,
    );

    expect(result.data.addressSnapshot?.street).toContain('République');
    expect(result.data.client).toMatchObject({
      firstName: 'Ada',
      phone: '+33601000000',
    });
  });

  it('interdit un autre client', async () => {
    const { service, prisma } = buildService();
    prisma.booking.findUnique.mockResolvedValue(detailRow);

    await expect(
      service.getById(
        '99999999-9999-4999-8999-999999999999',
        UserRole.client,
        bookingId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
