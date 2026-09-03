import { ProvidersService } from '../providers.service';
import { PrismaService } from '../../../prisma/prisma.service';

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

function buildService() {
  const prisma = {
    providerProfile: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    serviceOffer: {
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

  return {
    service: new ProvidersService(
      prismaWithTransaction as unknown as PrismaService,
    ),
    prisma: prismaWithTransaction,
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
});
