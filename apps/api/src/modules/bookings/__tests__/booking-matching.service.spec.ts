import {
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingMatchingService } from '../booking-matching.service';
import { BookingStateMachine } from '../booking-state.machine';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

const bookingId = '77777777-7777-4777-8777-777777777777';
const offerId = '44444444-4444-4444-8444-444444444444';
const zoneId = '66666666-6666-4666-8666-666666666666';
const providerId = '88888888-8888-4888-8888-888888888888';
const providerUserId = '99999999-9999-4999-8999-999999999999';

const slotStart = new Date('2026-09-13T14:00:00.000Z');
const slotEnd = new Date('2026-09-13T15:45:00.000Z');

const eligibleProvider = {
  id: providerId,
  userId: providerUserId,
  kycStatus: 'approved',
  ratingAvg: { toNumber: () => 4.8 },
  acceptanceRate: { toNumber: () => 95 },
  baseAddress: { lat: 45.76, lng: 4.84 },
  availability: [
    {
      dayOfWeek: 0,
      startTime: new Date('1970-01-01T08:00:00.000Z'),
      endTime: new Date('1970-01-01T18:00:00.000Z'),
      isActive: true,
    },
  ],
  blockedSlots: [],
  providerZones: [{ zoneId, radiusKm: 20 }],
  kycDocuments: [{ expiresAt: new Date('2027-01-01T00:00:00.000Z') }],
  bookings: [],
};

function buildService() {
  const prisma = {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    providerProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    providerCapability: {
      findUnique: jest.fn(),
    },
    bookingBroadcast: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    bookingStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
  );

  const redis = {
    client: { lpush: jest.fn().mockResolvedValue(1) },
  };
  const config = { get: jest.fn().mockReturnValue(undefined) };
  const bookingNotifications = {
    onNewMissionBroadcast: jest.fn().mockResolvedValue(undefined),
    onProviderAssigned: jest.fn().mockResolvedValue(undefined),
    onEnRoute: jest.fn().mockResolvedValue(undefined),
    onCompleted: jest.fn().mockResolvedValue(undefined),
  };

  return {
    service: new BookingMatchingService(
      prisma as unknown as PrismaService,
      new BookingStateMachine(),
      redis as unknown as RedisService,
      config as unknown as ConfigService,
      bookingNotifications as never,
    ),
    prisma,
    redis,
    bookingNotifications,
  };
}

describe('BookingMatchingService', () => {
  describe('findEligible', () => {
    it('garde un pro KYC + RC Pro + capability + zone + dispo (RG-MATCH-01)', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.findMany.mockResolvedValue([eligibleProvider]);

      const result = await service.findEligible({
        offerId,
        zoneId,
        slotStart,
        slotEnd,
        destination: { lat: 45.764, lng: 4.835 },
        now: new Date('2026-09-13T10:00:00.000Z'),
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.providerId).toBe(providerId);
      expect(result[0]?.score).toBeGreaterThan(0);
      expect(prisma.providerProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            kycStatus: 'approved',
            chargesEnabled: true,
          }),
        }),
      );
    });

    it('exclut une RC Pro expirée', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.findMany.mockResolvedValue([
        {
          ...eligibleProvider,
          kycDocuments: [{ expiresAt: new Date('2026-01-01T00:00:00.000Z') }],
        },
      ]);

      await expect(
        service.findEligible({
          offerId,
          zoneId,
          slotStart,
          slotEnd,
          destination: { lat: 45.764, lng: 4.835 },
          now: new Date('2026-09-13T10:00:00.000Z'),
        }),
      ).resolves.toEqual([]);
    });

    it('exclut un pro hors rayon', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.findMany.mockResolvedValue([
        {
          ...eligibleProvider,
          baseAddress: { lat: 48.85, lng: 2.35 },
          providerZones: [{ zoneId, radiusKm: 5 }],
        },
      ]);

      await expect(
        service.findEligible({
          offerId,
          zoneId,
          slotStart,
          slotEnd,
          destination: { lat: 45.764, lng: 4.835 },
        }),
      ).resolves.toEqual([]);
    });

    it('inclut un pro hors rayon initial après T1 ×2 (RG-MATCH-04)', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.findMany.mockResolvedValue([
        {
          ...eligibleProvider,
          baseAddress: { lat: 45.83, lng: 4.835 },
          providerZones: [{ zoneId, radiusKm: 5 }],
        },
      ]);

      await expect(
        service.findEligible({
          offerId,
          zoneId,
          slotStart,
          slotEnd,
          destination: { lat: 45.764, lng: 4.835 },
        }),
      ).resolves.toEqual([]);

      const expanded = await service.findEligible({
        offerId,
        zoneId,
        slotStart,
        slotEnd,
        destination: { lat: 45.764, lng: 4.835 },
        radiusMultiplier: 2,
      });
      expect(expanded).toHaveLength(1);
    });

    it('trie le plus proche en premier (RG-MATCH-02)', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.findMany.mockResolvedValue([
        {
          ...eligibleProvider,
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          baseAddress: { lat: 45.8, lng: 4.9 },
        },
        eligibleProvider,
      ]);

      const result = await service.findEligible({
        offerId,
        zoneId,
        slotStart,
        slotEnd,
        destination: { lat: 45.764, lng: 4.835 },
      });

      expect(result[0]?.providerId).toBe(providerId);
    });
  });

  describe('broadcast', () => {
    it('persiste le top N, passe en pending_provider et enqueue un push', async () => {
      const { service, prisma, bookingNotifications } = buildService();
      prisma.booking.findUnique.mockResolvedValue({
        id: bookingId,
        reference: 'CS-20260913-A7B2',
        status: 'payment_authorized',
        zoneId,
        slotStart,
        slotEnd,
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
        items: [{ offerId, offerName: 'Lavage complet' }],
        zone: { slug: 'lyon', name: 'Lyon' },
      });
      prisma.providerProfile.findMany.mockResolvedValue([eligibleProvider]);

      await expect(service.broadcast(bookingId)).resolves.toEqual({
        broadcastCount: 1,
        status: 'pending_provider',
      });
      expect(prisma.bookingBroadcast.createMany).toHaveBeenCalled();
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: bookingId },
        data: { status: 'pending_provider' },
      });
      expect(bookingNotifications.onNewMissionBroadcast).toHaveBeenCalledWith({
        bookingId,
        reference: 'CS-20260913-A7B2',
        slotStart,
        providerIds: [providerId],
      });
    });

    it('reste payment_authorized si aucun pro éligible', async () => {
      const { service, prisma } = buildService();
      prisma.booking.findUnique.mockResolvedValue({
        id: bookingId,
        status: 'payment_authorized',
        zoneId,
        slotStart,
        slotEnd,
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
        items: [{ offerId }],
        zone: { slug: 'lyon', name: 'Lyon' },
      });
      prisma.providerProfile.findMany.mockResolvedValue([]);

      await expect(service.broadcast(bookingId)).resolves.toEqual({
        broadcastCount: 0,
        status: 'payment_authorized',
      });
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });
  });

  describe('listAvailable', () => {
    it('retourne les missions pending proposées au pro', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.findUnique.mockResolvedValue({
        id: providerId,
      });
      prisma.bookingBroadcast.findMany.mockResolvedValue([
        {
          score: { toNumber: () => 72.5 },
          booking: {
            id: bookingId,
            reference: 'CS-20260913-A7B2',
            slotStart,
            slotEnd,
            pricingSnapshot: {
              base: 8500,
              vehicleSurcharge: 1000,
              options: [],
              serviceFee: 200,
              totalCents: 9700,
              currency: 'EUR',
            },
            items: [{ offerName: 'Lavage complet' }],
            zone: { slug: 'lyon', name: 'Lyon' },
          },
        },
      ]);

      await expect(service.listAvailable(providerUserId)).resolves.toEqual({
        data: [
          {
            id: bookingId,
            reference: 'CS-20260913-A7B2',
            slotStart: slotStart.toISOString(),
            slotEnd: slotEnd.toISOString(),
            offerName: 'Lavage complet',
            totalCents: 9700,
            currency: 'EUR',
            score: 72.5,
            zone: { slug: 'lyon', name: 'Lyon' },
          },
        ],
      });
    });
  });

  describe('tryClaim', () => {
    it('verrouille et assigne le premier accept (RG-MATCH-03)', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.findUnique.mockResolvedValue({
        id: providerId,
        userId: providerUserId,
      });
      prisma.booking.findUnique.mockResolvedValue({
        id: bookingId,
        status: 'pending_provider',
        items: [{ offerId }],
        broadcasts: [{ providerId }],
      });
      prisma.providerCapability.findUnique.mockResolvedValue({
        isActive: true,
      });
      prisma.booking.update.mockResolvedValue({
        id: bookingId,
        status: 'accepted',
        providerId,
      });

      await expect(service.tryClaim(bookingId, providerUserId)).resolves.toEqual(
        {
          id: bookingId,
          status: 'accepted',
          providerId,
        },
      );
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            providerId,
            status: 'accepted',
          }),
        }),
      );
    });

    it('refuse si déjà pris', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.findUnique.mockResolvedValue({
        id: providerId,
        userId: providerUserId,
      });
      prisma.booking.findUnique.mockResolvedValue({
        id: bookingId,
        status: 'accepted',
        items: [{ offerId }],
        broadcasts: [{ providerId }],
      });

      await expect(
        service.tryClaim(bookingId, providerUserId),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuse un pro hors broadcast', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.findUnique.mockResolvedValue({
        id: providerId,
        userId: providerUserId,
      });
      prisma.booking.findUnique.mockResolvedValue({
        id: bookingId,
        status: 'pending_provider',
        items: [{ offerId }],
        broadcasts: [{ providerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }],
      });

      await expect(
        service.tryClaim(bookingId, providerUserId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('decline', () => {
    it('retire le pro du broadcast et baisse le taux d’acceptation', async () => {
      const { service, prisma, redis } = buildService();
      prisma.providerProfile.findUnique.mockResolvedValue({
        id: providerId,
        userId: providerUserId,
        acceptanceRate: { toNumber: () => 95 },
      });
      prisma.booking.findUnique.mockResolvedValue({
        id: bookingId,
        status: 'pending_provider',
        broadcasts: [{ providerId }, { providerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }],
      });
      await expect(service.decline(bookingId, providerUserId)).resolves.toEqual({
        declined: true,
        bookingId,
        remainingBroadcasts: 1,
      });
      expect(prisma.bookingBroadcast.delete).toHaveBeenCalledWith({
        where: {
          bookingId_providerId: { bookingId, providerId },
        },
      });
      expect(prisma.providerProfile.update).toHaveBeenCalledWith({
        where: { id: providerId },
        data: { acceptanceRate: expect.anything() },
      });
      expect(redis.client.lpush).toHaveBeenCalledWith(
        'notifications:push',
        expect.stringContaining('booking.declined'),
      );
    });
  });

  describe('expandRadius / timeoutUnassigned', () => {
    it('ajoute les nouveaux pros hors rayon initial (RG-MATCH-04)', async () => {
      const extraId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
      const { service, prisma, bookingNotifications } = buildService();
      prisma.booking.findUnique.mockResolvedValue({
        id: bookingId,
        reference: 'CS-20260913-A7B2',
        status: 'pending_provider',
        zoneId,
        slotStart,
        slotEnd,
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
        items: [{ offerId }],
        zone: { id: zoneId },
        broadcasts: [{ providerId, rank: 1 }],
      });
      prisma.providerProfile.findMany.mockResolvedValue([
        eligibleProvider,
        { ...eligibleProvider, id: extraId },
      ]);

      await expect(service.expandRadius(bookingId)).resolves.toEqual({
        skipped: false,
        reason: 'expanded',
        added: 1,
      });
      expect(prisma.bookingBroadcast.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            bookingId,
            providerId: extraId,
            rank: 2,
          }),
        ],
      });
      expect(bookingNotifications.onNewMissionBroadcast).toHaveBeenCalledWith({
        bookingId,
        reference: 'CS-20260913-A7B2',
        slotStart,
        providerIds: [extraId],
      });
    });

    it('ne fait rien si déjà accepted', async () => {
      const { service, prisma } = buildService();
      prisma.booking.findUnique.mockResolvedValue({
        id: bookingId,
        status: 'accepted',
        items: [],
        broadcasts: [],
      });

      await expect(service.expandRadius(bookingId)).resolves.toEqual({
        skipped: true,
        reason: 'not_pending',
        added: 0,
      });
    });

    it('passe pending_provider → unassigned (RG-MATCH-05)', async () => {
      const { service, prisma, redis } = buildService();
      prisma.booking.findUnique.mockResolvedValue({
        id: bookingId,
        status: 'pending_provider',
      });

      await expect(service.timeoutUnassigned(bookingId)).resolves.toEqual({
        skipped: false,
        status: 'unassigned',
      });
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: bookingId },
        data: { status: 'unassigned' },
      });
      expect(prisma.bookingStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          toStatus: 'unassigned',
          actorType: 'system',
          reason: 'matching_timeout_t2',
        }),
      });
      expect(redis.client.lpush).toHaveBeenCalledWith(
        'notifications:push',
        expect.stringContaining('booking.unassigned'),
      );
    });

    it('ignore T2 si le booking n’est plus en matching', async () => {
      const { service, prisma } = buildService();
      prisma.booking.findUnique.mockResolvedValue({
        id: bookingId,
        status: 'accepted',
      });

      await expect(service.timeoutUnassigned(bookingId)).resolves.toEqual({
        skipped: true,
        reason: 'not_pending',
      });
    });
  });
});
