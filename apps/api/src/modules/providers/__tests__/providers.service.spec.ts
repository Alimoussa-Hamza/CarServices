import { ProvidersService } from '../providers.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

const profile = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: '22222222-2222-4222-8222-222222222222',
  companyName: 'Clean Auto Lyon',
  siret: '12345678901234',
  iban: null,
  bio: 'Lavage écologique à domicile.',
  avatarUrl: 'https://example.com/avatar.jpg',
  kycStatus: 'draft' as const,
  kycRejectionReason: null,
  washMethods: ['waterless' as const],
  ratingAvg: { toNumber: () => 4.5 },
  ratingCount: 12,
  acceptanceRate: { toNumber: () => 98.5 },
  stripeAccountId: null,
  chargesEnabled: false,
  baseAddressId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const kycDocument = {
  id: '33333333-3333-4333-8333-333333333333',
  providerId: profile.id,
  docType: 'rc_pro' as const,
  fileUrl: 'https://example.com/rc-pro.pdf',
  expiresAt: new Date('2099-12-31T00:00:00.000Z'),
  verifiedAt: null,
  verifiedBy: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const washOffer = {
  id: '44444444-4444-4444-8444-444444444444',
  slug: 'wash-complete',
  name: 'Lavage complet',
  description: null,
  basePriceCents: 7900,
  durationMinutes: 90,
  formSchema: {},
  checklistTemplate: {},
  isActive: true,
  sortOrder: 2,
  categoryId: '55555555-5555-4555-8555-555555555555',
  category: {
    id: '55555555-5555-4555-8555-555555555555',
    slug: 'wash',
    name: 'Lavage auto',
    description: null,
    icon: null,
    isEnabled: true,
    sortOrder: 0,
  },
};

const washCapability = {
  providerId: profile.id,
  offerId: washOffer.id,
  isActive: true,
  offer: washOffer,
};

const weeklySlot = {
  id: '77777777-7777-4777-8777-777777777777',
  providerId: profile.id,
  dayOfWeek: 1,
  startTime: new Date('1970-01-01T09:00:00.000Z'),
  endTime: new Date('1970-01-01T12:00:00.000Z'),
  isActive: true,
};

const blockedSlot = {
  id: '88888888-8888-4888-8888-888888888888',
  providerId: profile.id,
  startAt: new Date('2026-09-10T09:00:00.000Z'),
  endAt: new Date('2026-09-10T12:00:00.000Z'),
  reason: 'Congé',
};

const serviceZone = {
  id: '99999999-9999-4999-8999-999999999999',
  name: 'Lyon',
  slug: 'lyon',
  polygon: null,
  isActive: true,
  priceCoefficient: { toNumber: () => 1 },
  minBookingLeadHours: 2,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const providerZone = {
  providerId: profile.id,
  zoneId: serviceZone.id,
  radiusKm: { toNumber: () => 12.5 },
  zone: serviceZone,
};

async function withMockedFetch<T>(
  fetchMock: jest.Mock,
  action: () => Promise<T>,
): Promise<T> {
  const originalFetch = global.fetch;
  global.fetch = fetchMock as unknown as typeof fetch;
  try {
    return await action();
  } finally {
    global.fetch = originalFetch;
  }
}

function buildService() {
  const prisma = {
    providerProfile: {
      upsert: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    serviceOffer: {
      findMany: jest.fn(),
    },
    serviceZone: {
      findMany: jest.fn(),
    },
    providerZone: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    providerCapability: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    providerKycDocument: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    providerAvailability: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    providerBlockedSlot: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };
  const prismaWithTransaction = {
    ...prisma,
    $transaction: jest.fn(
      (
        action:
          | Array<Promise<unknown>>
          | ((tx: typeof prisma) => Promise<unknown>),
      ) => (Array.isArray(action) ? Promise.all(action) : action(prisma)),
    ),
  };
  const config = {
    get: jest.fn(),
  };

  return {
    service: new ProvidersService(
      prismaWithTransaction as unknown as PrismaService,
      config as unknown as ConfigService,
    ),
    prisma: prismaWithTransaction,
    config,
  };
}

describe('ProvidersService', () => {
  describe('getMe', () => {
    it('retourne le profil provider courant', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue(profile);

      await expect(service.getMe(profile.userId)).resolves.toEqual({
        data: {
          id: profile.id,
          userId: profile.userId,
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
          chargesEnabled: false,
          baseAddressId: null,
        },
      });

      expect(prisma.providerProfile.upsert).toHaveBeenCalledWith({
        where: { userId: profile.userId },
        update: {},
        create: { userId: profile.userId },
      });
    });
  });

  describe('updateMe', () => {
    it('met à jour uniquement les champs éditables du profil pro', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        companyName: 'Clean Auto Pro',
        washMethods: ['waterless', 'steam'],
      });

      const result = await service.updateMe(profile.userId, {
        companyName: 'Clean Auto Pro',
        siret: '12345678901234',
        bio: 'Expert lavage sans eau.',
        avatarUrl: 'https://example.com/pro.jpg',
        washMethods: ['waterless', 'steam'],
        baseAddressId: null,
      });

      expect(prisma.providerProfile.upsert).toHaveBeenCalledWith({
        where: { userId: profile.userId },
        update: {
          companyName: 'Clean Auto Pro',
          siret: '12345678901234',
          bio: 'Expert lavage sans eau.',
          avatarUrl: 'https://example.com/pro.jpg',
          washMethods: ['waterless', 'steam'],
          baseAddressId: null,
        },
        create: {
          userId: profile.userId,
          companyName: 'Clean Auto Pro',
          siret: '12345678901234',
          bio: 'Expert lavage sans eau.',
          avatarUrl: 'https://example.com/pro.jpg',
          washMethods: ['waterless', 'steam'],
          baseAddressId: null,
        },
      });
      expect(result.data.companyName).toBe('Clean Auto Pro');
      expect(result.data.washMethods).toEqual(['waterless', 'steam']);
    });

    it('garde washMethods vide à la création si non fourni', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        companyName: 'Clean Auto Pro',
        washMethods: [],
      });

      await service.updateMe(profile.userId, {
        companyName: 'Clean Auto Pro',
      });

      expect(prisma.providerProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ washMethods: [] }),
        }),
      );
    });

    it('retourne une erreur métier si le SIRET est déjà utilisé', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['siret'] },
      });

      await expect(
        service.updateMe(profile.userId, { siret: '12345678901234' }),
      ).rejects.toMatchObject({
        response: { code: 'SIRET_ALREADY_USED' },
      });
    });
  });

  describe('submitKyc', () => {
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

    it('soumet un dossier KYC depuis draft et remplace les documents', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue(profile);
      prisma.providerKycDocument.deleteMany.mockResolvedValue({ count: 0 });
      prisma.providerKycDocument.createMany.mockResolvedValue({ count: 1 });
      prisma.providerProfile.update.mockResolvedValue({
        ...profile,
        kycStatus: 'submitted',
        kycDocuments: [kycDocument],
      });

      await expect(service.submitKyc(profile.userId, dto)).resolves.toEqual({
        data: {
          status: 'submitted',
          rejectionReason: null,
          documents: [
            {
              id: kycDocument.id,
              docType: 'rc_pro',
              fileUrl: 'https://example.com/rc-pro.pdf',
              expiresAt: '2099-12-31',
              verifiedAt: null,
            },
          ],
          rcProAlert: null,
        },
      });

      expect(prisma.providerKycDocument.deleteMany).toHaveBeenCalledWith({
        where: { providerId: profile.id },
      });
      expect(prisma.providerKycDocument.createMany).toHaveBeenCalledWith({
        data: [
          {
            providerId: profile.id,
            docType: 'rc_pro',
            fileUrl: 'https://example.com/rc-pro.pdf',
            expiresAt: new Date('2099-12-31T00:00:00.000Z'),
          },
        ],
      });
      expect(prisma.providerProfile.update).toHaveBeenCalledWith({
        where: { id: profile.id },
        data: {
          siret: '12345678901234',
          washMethods: ['waterless'],
          kycStatus: 'submitted',
          kycRejectionReason: null,
        },
        include: {
          kycDocuments: { orderBy: { createdAt: 'asc' } },
        },
      });
    });

    it('autorise une nouvelle soumission après rejet', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycStatus: 'rejected',
      });
      prisma.providerProfile.update.mockResolvedValue({
        ...profile,
        kycStatus: 'submitted',
        kycDocuments: [kycDocument],
      });

      await expect(service.submitKyc(profile.userId, dto)).resolves.toMatchObject({
        data: { status: 'submitted' },
      });
    });

    it('refuse une soumission si le dossier est déjà submitted', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycStatus: 'submitted',
      });

      await expect(service.submitKyc(profile.userId, dto)).rejects.toMatchObject({
        response: { code: 'KYC_ALREADY_SUBMITTED' },
      });
      expect(prisma.providerKycDocument.deleteMany).not.toHaveBeenCalled();
    });

    it('refuse une soumission si le dossier est déjà approved', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycStatus: 'approved',
      });

      await expect(service.submitKyc(profile.userId, dto)).rejects.toMatchObject({
        response: { code: 'KYC_ALREADY_APPROVED' },
      });
    });

    it('retourne une erreur métier si le SIRET soumis est déjà utilisé', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue(profile);
      prisma.providerProfile.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['siret'] },
      });

      await expect(service.submitKyc(profile.userId, dto)).rejects.toMatchObject({
        response: { code: 'SIRET_ALREADY_USED' },
      });
    });
  });

  describe('getKycStatus', () => {
    it('retourne le statut KYC et les documents', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycStatus: 'submitted',
        kycDocuments: [kycDocument],
      });

      await expect(service.getKycStatus(profile.userId)).resolves.toEqual({
        data: {
          status: 'submitted',
          rejectionReason: null,
          documents: [
            {
              id: kycDocument.id,
              docType: 'rc_pro',
              fileUrl: 'https://example.com/rc-pro.pdf',
              expiresAt: '2099-12-31',
              verifiedAt: null,
            },
          ],
          rcProAlert: null,
        },
      });
    });

    it('inclut rcProAlert expiring_soon dans le statut KYC', async () => {
      const { service, prisma } = buildService();
      const now = new Date('2026-09-03T12:00:00.000Z');
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycStatus: 'approved',
        kycDocuments: [
          { ...kycDocument, expiresAt: new Date('2026-09-20T00:00:00.000Z') },
        ],
      });

      await expect(service.getKycStatus(profile.userId, now)).resolves.toEqual({
        data: {
          status: 'approved',
          rejectionReason: null,
          documents: [
            {
              id: kycDocument.id,
              docType: 'rc_pro',
              fileUrl: 'https://example.com/rc-pro.pdf',
              expiresAt: '2026-09-20',
              verifiedAt: null,
            },
          ],
          rcProAlert: {
            kind: 'expiring_soon',
            expiresAt: '2026-09-20',
            daysRemaining: 17,
          },
        },
      });
    });
  });

  describe('getKycAlerts', () => {
    const now = new Date('2026-09-03T12:00:00.000Z');

    it('ne renvoie pas d’alerte si la RC Pro expire dans plus de 30 jours', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycDocuments: [kycDocument],
      });

      await expect(service.getKycAlerts(profile.userId, now)).resolves.toEqual({
        data: { alert: null },
      });
    });

    it('alerte expiring_soon à J-30', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycDocuments: [
          { ...kycDocument, expiresAt: new Date('2026-10-03T00:00:00.000Z') },
        ],
      });

      await expect(service.getKycAlerts(profile.userId, now)).resolves.toEqual({
        data: {
          alert: {
            kind: 'expiring_soon',
            expiresAt: '2026-10-03',
            daysRemaining: 30,
          },
        },
      });
    });

    it('alerte expiring_soon le jour d’expiration', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycDocuments: [
          { ...kycDocument, expiresAt: new Date('2026-09-03T00:00:00.000Z') },
        ],
      });

      await expect(service.getKycAlerts(profile.userId, now)).resolves.toEqual({
        data: {
          alert: {
            kind: 'expiring_soon',
            expiresAt: '2026-09-03',
            daysRemaining: 0,
          },
        },
      });
    });

    it('n’alerte pas à J-31', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycDocuments: [
          { ...kycDocument, expiresAt: new Date('2026-10-04T00:00:00.000Z') },
        ],
      });

      await expect(service.getKycAlerts(profile.userId, now)).resolves.toEqual({
        data: { alert: null },
      });
    });

    it('alerte expired après la date d’expiration', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycDocuments: [
          { ...kycDocument, expiresAt: new Date('2026-09-02T00:00:00.000Z') },
        ],
      });

      await expect(service.getKycAlerts(profile.userId, now)).resolves.toEqual({
        data: {
          alert: {
            kind: 'expired',
            expiresAt: '2026-09-02',
            daysRemaining: -1,
          },
        },
      });
    });

    it('ne renvoie pas d’alerte sans document RC Pro', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycDocuments: [],
      });

      await expect(service.getKycAlerts(profile.userId, now)).resolves.toEqual({
        data: { alert: null },
      });
    });
  });

  describe('assertCanReceiveMissions / getMissionEligibility', () => {
    const now = new Date('2026-09-03T12:00:00.000Z');

    it.each(['draft', 'submitted', 'rejected'] as const)(
      'bloque un provider KYC %s',
      async (kycStatus) => {
        const { service, prisma } = buildService();
        prisma.providerProfile.upsert.mockResolvedValue({
          ...profile,
          kycStatus,
          kycDocuments: [kycDocument],
        });

        await expect(
          service.assertCanReceiveMissions(profile.userId, now),
        ).rejects.toMatchObject({
          response: {
            code: 'KYC_NOT_APPROVED',
            details: { kycStatus },
          },
        });
      },
    );

    it('autorise un provider approved avec RC Pro valide', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycStatus: 'approved',
        chargesEnabled: true,
        kycDocuments: [kycDocument],
      });

      await expect(
        service.getMissionEligibility(profile.userId, now),
      ).resolves.toEqual({
        data: { eligible: true, kycStatus: 'approved' },
      });
      expect(prisma.providerProfile.upsert).toHaveBeenCalledWith({
        where: { userId: profile.userId },
        update: {},
        create: { userId: profile.userId },
        include: {
          kycDocuments: {
            where: { docType: 'rc_pro' },
            orderBy: { expiresAt: 'desc' },
          },
        },
      });
    });

    it('autorise si la RC Pro expire aujourd’hui', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycStatus: 'approved',
        chargesEnabled: true,
        kycDocuments: [
          { ...kycDocument, expiresAt: new Date('2026-09-03T00:00:00.000Z') },
        ],
      });

      await expect(
        service.assertCanReceiveMissions(profile.userId, now),
      ).resolves.toBeUndefined();
    });

    it('bloque un provider approved sans RC Pro', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycStatus: 'approved',
        kycDocuments: [],
      });

      await expect(
        service.getMissionEligibility(profile.userId, now),
      ).rejects.toMatchObject({
        response: {
          code: 'RC_PRO_EXPIRED',
          details: { expiresAt: null },
        },
      });
    });

    it('bloque un provider approved avec RC Pro expirée', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycStatus: 'approved',
        kycDocuments: [
          { ...kycDocument, expiresAt: new Date('2026-09-02T00:00:00.000Z') },
        ],
      });

      await expect(
        service.assertCanReceiveMissions(profile.userId, now),
      ).rejects.toMatchObject({
        response: {
          code: 'RC_PRO_EXPIRED',
          details: { expiresAt: '2026-09-02' },
        },
      });
    });

    it('bloque un provider approved sans charges_enabled Stripe', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        kycStatus: 'approved',
        chargesEnabled: false,
        kycDocuments: [kycDocument],
      });

      await expect(
        service.assertCanReceiveMissions(profile.userId, now),
      ).rejects.toMatchObject({
        response: {
          code: 'STRIPE_CHARGES_DISABLED',
          details: { chargesEnabled: false },
        },
      });
    });
  });

  describe('listCapabilities', () => {
    it('retourne les capabilities actives triées par offre', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        capabilities: [washCapability],
      });

      await expect(service.listCapabilities(profile.userId)).resolves.toEqual({
        data: {
          capabilities: [
            {
              offerId: washOffer.id,
              offerSlug: 'wash-complete',
              offerName: 'Lavage complet',
              categorySlug: 'wash',
              isActive: true,
            },
          ],
        },
      });
    });
  });

  describe('updateCapabilities', () => {
    it('ignore les offres non wash et remplace les capabilities valides', async () => {
      const { service, prisma } = buildService();
      const batteryOfferId = '66666666-6666-4666-8666-666666666666';
      prisma.providerProfile.upsert.mockResolvedValue(profile);
      prisma.serviceOffer.findMany.mockResolvedValue([washOffer]);
      prisma.providerCapability.deleteMany.mockResolvedValue({ count: 0 });
      prisma.providerCapability.createMany.mockResolvedValue({ count: 1 });
      prisma.providerCapability.findMany.mockResolvedValue([washCapability]);

      await expect(
        service.updateCapabilities(profile.userId, {
          offerIds: [washOffer.id, batteryOfferId],
        }),
      ).resolves.toEqual({
        data: {
          capabilities: [
            {
              offerId: washOffer.id,
              offerSlug: 'wash-complete',
              offerName: 'Lavage complet',
              categorySlug: 'wash',
              isActive: true,
            },
          ],
        },
      });

      expect(prisma.serviceOffer.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [washOffer.id, batteryOfferId] },
          isActive: true,
          category: { slug: 'wash' },
        },
        include: { category: true },
      });
      expect(prisma.providerCapability.deleteMany).toHaveBeenCalledWith({
        where: { providerId: profile.id },
      });
      expect(prisma.providerCapability.createMany).toHaveBeenCalledWith({
        data: [{ providerId: profile.id, offerId: washOffer.id, isActive: true }],
        skipDuplicates: true,
      });
    });

    it('rejette une liste sans capability wash valide', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue(profile);
      prisma.serviceOffer.findMany.mockResolvedValue([]);

      await expect(
        service.updateCapabilities(profile.userId, {
          offerIds: ['66666666-6666-4666-8666-666666666666'],
        }),
      ).rejects.toMatchObject({
        response: { code: 'NO_VALID_CAPABILITIES' },
      });
    });
  });

  describe('getAvailability', () => {
    it('retourne les plages hebdo et créneaux bloqués', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        availability: [weeklySlot],
        blockedSlots: [blockedSlot],
      });

      await expect(service.getAvailability(profile.userId)).resolves.toEqual({
        data: {
          weeklySlots: [
            {
              id: weeklySlot.id,
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '12:00',
              isActive: true,
            },
          ],
          blockedSlots: [
            {
              id: blockedSlot.id,
              startAt: '2026-09-10T09:00:00.000Z',
              endAt: '2026-09-10T12:00:00.000Z',
              reason: 'Congé',
            },
          ],
        },
      });

      expect(prisma.providerProfile.upsert).toHaveBeenCalledWith({
        where: { userId: profile.userId },
        update: {},
        create: { userId: profile.userId },
        include: {
          availability: {
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
          },
          blockedSlots: {
            orderBy: { startAt: 'asc' },
          },
        },
      });
    });
  });

  describe('updateAvailability', () => {
    it('remplace les disponibilités hebdo et créneaux bloqués', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue(profile);
      prisma.providerAvailability.deleteMany.mockResolvedValue({ count: 0 });
      prisma.providerBlockedSlot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.providerAvailability.createMany.mockResolvedValue({ count: 1 });
      prisma.providerBlockedSlot.createMany.mockResolvedValue({ count: 1 });
      prisma.providerProfile.findUniqueOrThrow.mockResolvedValue({
        ...profile,
        availability: [weeklySlot],
        blockedSlots: [blockedSlot],
      });

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

      await expect(
        service.updateAvailability(profile.userId, dto),
      ).resolves.toEqual({
        data: {
          weeklySlots: [
            {
              id: weeklySlot.id,
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '12:00',
              isActive: true,
            },
          ],
          blockedSlots: [
            {
              id: blockedSlot.id,
              startAt: '2026-09-10T09:00:00.000Z',
              endAt: '2026-09-10T12:00:00.000Z',
              reason: 'Congé',
            },
          ],
        },
      });

      expect(prisma.providerAvailability.deleteMany).toHaveBeenCalledWith({
        where: { providerId: profile.id },
      });
      expect(prisma.providerBlockedSlot.deleteMany).toHaveBeenCalledWith({
        where: { providerId: profile.id },
      });
      expect(prisma.providerAvailability.createMany).toHaveBeenCalledWith({
        data: [
          {
            providerId: profile.id,
            dayOfWeek: 1,
            startTime: new Date('1970-01-01T09:00:00.000Z'),
            endTime: new Date('1970-01-01T12:00:00.000Z'),
            isActive: true,
          },
        ],
      });
      expect(prisma.providerBlockedSlot.createMany).toHaveBeenCalledWith({
        data: [
          {
            providerId: profile.id,
            startAt: new Date('2026-09-10T09:00:00.000Z'),
            endAt: new Date('2026-09-10T12:00:00.000Z'),
            reason: 'Congé',
          },
        ],
      });
    });
  });

  describe('listZones', () => {
    it('retourne les zones actives du provider', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        providerZones: [providerZone],
      });

      await expect(service.listZones(profile.userId)).resolves.toEqual({
        data: {
          zones: [
            {
              zoneId: serviceZone.id,
              zoneSlug: 'lyon',
              zoneName: 'Lyon',
              radiusKm: 12.5,
            },
          ],
        },
      });

      expect(prisma.providerProfile.upsert).toHaveBeenCalledWith({
        where: { userId: profile.userId },
        update: {},
        create: { userId: profile.userId },
        include: {
          providerZones: {
            where: { zone: { isActive: true } },
            include: { zone: true },
          },
        },
      });
    });
  });

  describe('updateZones', () => {
    it('remplace les zones par les zones plateforme actives', async () => {
      const { service, prisma } = buildService();
      const inactiveZoneId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
      prisma.providerProfile.upsert.mockResolvedValue(profile);
      prisma.serviceZone.findMany.mockResolvedValue([serviceZone]);
      prisma.providerZone.deleteMany.mockResolvedValue({ count: 0 });
      prisma.providerZone.createMany.mockResolvedValue({ count: 1 });
      prisma.providerZone.findMany.mockResolvedValue([providerZone]);

      await expect(
        service.updateZones(profile.userId, {
          zones: [
            { zoneId: serviceZone.id, radiusKm: 12.5 },
            { zoneId: inactiveZoneId, radiusKm: 20 },
          ],
        }),
      ).resolves.toEqual({
        data: {
          zones: [
            {
              zoneId: serviceZone.id,
              zoneSlug: 'lyon',
              zoneName: 'Lyon',
              radiusKm: 12.5,
            },
          ],
        },
      });

      expect(prisma.serviceZone.findMany).toHaveBeenCalledWith({
        where: { id: { in: [serviceZone.id, inactiveZoneId] }, isActive: true },
      });
      expect(prisma.providerZone.deleteMany).toHaveBeenCalledWith({
        where: { providerId: profile.id },
      });
      expect(prisma.providerZone.createMany).toHaveBeenCalledWith({
        data: [
          {
            providerId: profile.id,
            zoneId: serviceZone.id,
            radiusKm: 12.5,
          },
        ],
        skipDuplicates: true,
      });
    });

    it('rejette une liste sans zone active valide', async () => {
      const { service, prisma } = buildService();
      prisma.providerProfile.upsert.mockResolvedValue(profile);
      prisma.serviceZone.findMany.mockResolvedValue([]);

      await expect(
        service.updateZones(profile.userId, {
          zones: [{ zoneId: serviceZone.id }],
        }),
      ).rejects.toMatchObject({
        response: { code: 'NO_VALID_PROVIDER_ZONES' },
      });
    });
  });

  describe('createStripeOnboardingLink', () => {
    it('crée un compte Connect dev et stocke son id si absent', async () => {
      const { service, prisma, config } = buildService();
      config.get.mockReturnValue(undefined);
      prisma.providerProfile.upsert.mockResolvedValue(profile);
      prisma.providerProfile.update.mockResolvedValue({
        ...profile,
        stripeAccountId: 'acct_dev_1111111111114111',
      });

      await expect(
        service.createStripeOnboardingLink(profile.userId, {
          returnUrl: 'https://pro.carservice.test/stripe/return',
          refreshUrl: 'https://pro.carservice.test/stripe/refresh',
        }),
      ).resolves.toEqual({
        data: {
          stripeAccountId: 'acct_dev_1111111111114111',
          url: 'https://pro.carservice.test/stripe/return?stripe_mock=onboarding&account=acct_dev_1111111111114111',
        },
      });

      expect(prisma.providerProfile.update).toHaveBeenCalledWith({
        where: { id: profile.id },
        data: { stripeAccountId: 'acct_dev_1111111111114111' },
      });
    });

    it('ignore le placeholder sk_test_xxx et reste en mock local', async () => {
      const { service, prisma, config } = buildService();
      config.get.mockReturnValue('sk_test_xxx');
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        stripeAccountId: 'acct_existing',
      });

      await expect(
        service.createStripeOnboardingLink(profile.userId, {
          returnUrl: 'https://pro.carservice.test/stripe/return',
          refreshUrl: 'https://pro.carservice.test/stripe/refresh',
        }),
      ).resolves.toEqual({
        data: {
          stripeAccountId: 'acct_existing',
          url: 'https://pro.carservice.test/stripe/return?stripe_mock=onboarding&account=acct_existing',
        },
      });
    });

    it('réutilise le compte Stripe existant sans le recréer', async () => {
      const { service, prisma, config } = buildService();
      config.get.mockReturnValue(undefined);
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        stripeAccountId: 'acct_existing',
      });

      await expect(
        service.createStripeOnboardingLink(profile.userId, {
          returnUrl: 'https://pro.carservice.test/stripe/return',
          refreshUrl: 'https://pro.carservice.test/stripe/refresh',
        }),
      ).resolves.toEqual({
        data: {
          stripeAccountId: 'acct_existing',
          url: 'https://pro.carservice.test/stripe/return?stripe_mock=onboarding&account=acct_existing',
        },
      });

      expect(prisma.providerProfile.update).not.toHaveBeenCalled();
    });

    it('crée un compte Express et un Account Link via Stripe', async () => {
      const { service, prisma, config } = buildService();
      config.get.mockReturnValue('sk_test_mocklocalkey16chars');
      prisma.providerProfile.upsert.mockResolvedValue(profile);
      prisma.providerProfile.update.mockResolvedValue({
        ...profile,
        stripeAccountId: 'acct_123',
      });

      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'acct_123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            url: 'https://connect.stripe.com/setup/s/acct_123',
          }),
        });
      const originalFetch = global.fetch;
      global.fetch = fetchMock as unknown as typeof fetch;

      try {
        await expect(
          service.createStripeOnboardingLink(profile.userId, {
            returnUrl: 'https://pro.carservice.test/stripe/return',
            refreshUrl: 'https://pro.carservice.test/stripe/refresh',
          }),
        ).resolves.toEqual({
          data: {
            stripeAccountId: 'acct_123',
            url: 'https://connect.stripe.com/setup/s/acct_123',
          },
        });
      } finally {
        global.fetch = originalFetch;
      }

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://api.stripe.com/v1/accounts',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer sk_test_mocklocalkey16chars',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Stripe-Version': '2024-11-20.acacia',
          },
        }),
      );
      const accountBody = String(fetchMock.mock.calls[0]?.[1]?.body);
      expect(accountBody).toContain('type=express');
      expect(accountBody).toContain('country=FR');
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://api.stripe.com/v1/account_links',
        expect.objectContaining({
          method: 'POST',
        }),
      );
      const linkBody = String(fetchMock.mock.calls[1]?.[1]?.body);
      expect(linkBody).toContain('account=acct_123');
      expect(linkBody).toContain('type=account_onboarding');
    });

    it('remonte une indisponibilité Stripe Connect', async () => {
      const { service, prisma, config } = buildService();
      config.get.mockReturnValue('sk_test_mocklocalkey16chars');
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        stripeAccountId: 'acct_existing',
      });

      const fetchMock = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await withMockedFetch(fetchMock, async () => {
        await expect(
          service.createStripeOnboardingLink(profile.userId, {
            returnUrl: 'https://pro.carservice.test/stripe/return',
            refreshUrl: 'https://pro.carservice.test/stripe/refresh',
          }),
        ).rejects.toMatchObject({
          response: { code: 'STRIPE_REQUEST_FAILED' },
        });
      });
    });

    it('traite une clé vide ou uniquement des espaces comme mock local', async () => {
      const { service, prisma, config } = buildService();
      config.get.mockReturnValue('   ');
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        stripeAccountId: 'acct_existing',
      });
      const fetchMock = jest.fn();

      await withMockedFetch(fetchMock, async () => {
        await expect(
          service.createStripeOnboardingLink(profile.userId, {
            returnUrl: 'https://pro.carservice.test/stripe/return',
            refreshUrl: 'https://pro.carservice.test/stripe/refresh',
          }),
        ).resolves.toMatchObject({
          data: { stripeAccountId: 'acct_existing' },
        });
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('accepte une restricted key rk_test_ comme clé Stripe réelle', async () => {
      const { service, prisma, config } = buildService();
      config.get.mockReturnValue('rk_test_mocklocalkey16chars');
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        stripeAccountId: 'acct_existing',
      });
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://connect.stripe.com/setup/s/acct_existing',
        }),
      });

      await withMockedFetch(fetchMock, async () => {
        await expect(
          service.createStripeOnboardingLink(profile.userId, {
            returnUrl: 'https://pro.carservice.test/stripe/return',
            refreshUrl: 'https://pro.carservice.test/stripe/refresh',
          }),
        ).resolves.toEqual({
          data: {
            stripeAccountId: 'acct_existing',
            url: 'https://connect.stripe.com/setup/s/acct_existing',
          },
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.stripe.com/v1/account_links',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer rk_test_mocklocalkey16chars',
          }),
        }),
      );
    });

    it('ne recrée pas le compte Stripe si stripeAccountId existe déjà', async () => {
      const { service, prisma, config } = buildService();
      config.get.mockReturnValue('sk_test_mocklocalkey16chars');
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        stripeAccountId: 'acct_existing',
      });
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://connect.stripe.com/setup/s/acct_existing',
        }),
      });

      await withMockedFetch(fetchMock, async () => {
        await service.createStripeOnboardingLink(profile.userId, {
          returnUrl: 'https://pro.carservice.test/stripe/return',
          refreshUrl: 'https://pro.carservice.test/stripe/refresh',
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
        'https://api.stripe.com/v1/account_links',
      );
      expect(prisma.providerProfile.update).not.toHaveBeenCalled();
    });

    it('demande card_payments et transfers sur le compte Express', async () => {
      const { service, prisma, config } = buildService();
      config.get.mockReturnValue('sk_test_mocklocalkey16chars');
      prisma.providerProfile.upsert.mockResolvedValue(profile);
      prisma.providerProfile.update.mockResolvedValue({
        ...profile,
        stripeAccountId: 'acct_123',
      });
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'acct_123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            url: 'https://connect.stripe.com/setup/s/acct_123',
          }),
        });

      await withMockedFetch(fetchMock, async () => {
        await service.createStripeOnboardingLink(profile.userId, {
          returnUrl: 'https://pro.carservice.test/stripe/return',
          refreshUrl: 'https://pro.carservice.test/stripe/refresh',
        });
      });

      const accountBody = String(fetchMock.mock.calls[0]?.[1]?.body);
      expect(accountBody).toContain(
        'capabilities%5Bcard_payments%5D%5Brequested%5D=true',
      );
      expect(accountBody).toContain(
        'capabilities%5Btransfers%5D%5Brequested%5D=true',
      );
      const linkBody = String(fetchMock.mock.calls[1]?.[1]?.body);
      expect(linkBody).toContain(
        'return_url=https%3A%2F%2Fpro.carservice.test%2Fstripe%2Freturn',
      );
      expect(linkBody).toContain(
        'refresh_url=https%3A%2F%2Fpro.carservice.test%2Fstripe%2Frefresh',
      );
    });

    it('remonte STRIPE_ACCOUNT_CREATE_FAILED si Stripe omet l’id', async () => {
      const { service, prisma, config } = buildService();
      config.get.mockReturnValue('sk_test_mocklocalkey16chars');
      prisma.providerProfile.upsert.mockResolvedValue(profile);
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await withMockedFetch(fetchMock, async () => {
        await expect(
          service.createStripeOnboardingLink(profile.userId, {
            returnUrl: 'https://pro.carservice.test/stripe/return',
            refreshUrl: 'https://pro.carservice.test/stripe/refresh',
          }),
        ).rejects.toMatchObject({
          response: { code: 'STRIPE_ACCOUNT_CREATE_FAILED' },
        });
      });

      expect(prisma.providerProfile.update).not.toHaveBeenCalled();
    });

    it('remonte STRIPE_ACCOUNT_LINK_FAILED si Stripe omet l’url', async () => {
      const { service, prisma, config } = buildService();
      config.get.mockReturnValue('sk_test_mocklocalkey16chars');
      prisma.providerProfile.upsert.mockResolvedValue({
        ...profile,
        stripeAccountId: 'acct_existing',
      });
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await withMockedFetch(fetchMock, async () => {
        await expect(
          service.createStripeOnboardingLink(profile.userId, {
            returnUrl: 'https://pro.carservice.test/stripe/return',
            refreshUrl: 'https://pro.carservice.test/stripe/refresh',
          }),
        ).rejects.toMatchObject({
          response: { code: 'STRIPE_ACCOUNT_LINK_FAILED' },
        });
      });
    });
  });
});
