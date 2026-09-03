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

function buildService() {
  const prisma = {
    providerProfile: {
      upsert: jest.fn(),
    },
  };

  return {
    service: new ProvidersService(prisma as unknown as PrismaService),
    prisma,
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
  });
});
