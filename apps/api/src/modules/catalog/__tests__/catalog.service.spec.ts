import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CatalogService } from '../catalog.service';
import { PrismaService } from '../../../prisma/prisma.service';

const category = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'wash',
  name: 'Lavage auto',
  description: 'Lavage écologique à domicile.',
  icon: 'sparkles',
  isEnabled: true,
  sortOrder: 1,
};

const offer = {
  id: '22222222-2222-4222-8222-222222222222',
  categoryId: category.id,
  slug: 'wash-complete',
  name: 'Lavage complet',
  description: 'Intérieur et extérieur.',
  basePriceCents: 8500,
  durationMinutes: 90,
  formSchema: {},
  checklistTemplate: {},
  isActive: true,
  sortOrder: 1,
  category,
  options: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      offerId: '22222222-2222-4222-8222-222222222222',
      slug: 'pet-hair',
      name: 'Poils animaux',
      priceDeltaCents: 1500,
      durationDeltaMinutes: 15,
      isActive: true,
    },
  ],
};

function buildService() {
  const prisma = {
    serviceCategory: {
      findMany: jest.fn(),
    },
    serviceZone: {
      findUnique: jest.fn(),
    },
    serviceOffer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  return {
    service: new CatalogService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('CatalogService', () => {
  describe('listCategories', () => {
    it('retourne uniquement les champs exposés par le contrat API', async () => {
      const { service, prisma } = buildService();
      prisma.serviceCategory.findMany.mockResolvedValue([category]);

      await expect(service.listCategories()).resolves.toEqual({
        data: [
          {
            id: category.id,
            slug: 'wash',
            name: 'Lavage auto',
            description: 'Lavage écologique à domicile.',
            icon: 'sparkles',
          },
        ],
      });
      expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith({
        where: { isEnabled: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
    });
  });

  describe('listOffers', () => {
    it('filtre les offres actives disponibles dans une zone active', async () => {
      const { service, prisma } = buildService();
      prisma.serviceZone.findUnique.mockResolvedValue({
        id: '44444444-4444-4444-8444-444444444444',
        slug: 'lyon',
        isActive: true,
      });
      prisma.serviceOffer.findMany.mockResolvedValue([offer]);

      const result = await service.listOffers('lyon');

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        slug: 'wash-complete',
        category: { slug: 'wash', name: 'Lavage auto' },
      });
      expect(prisma.serviceOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            category: { isEnabled: true },
            zonePricing: {
              some: { zoneId: '44444444-4444-4444-8444-444444444444' },
            },
          }),
        }),
      );
    });

    it('retourne une liste vide si la zone demandée est inactive', async () => {
      const { service, prisma } = buildService();
      prisma.serviceZone.findUnique.mockResolvedValue({ isActive: false });

      await expect(service.listOffers('lyon')).resolves.toEqual({ data: [] });
      expect(prisma.serviceOffer.findMany).not.toHaveBeenCalled();
    });
  });

  describe('quote', () => {
    it('calcule base + surcharge véhicule + options + frais service', async () => {
      const { service, prisma } = buildService();
      prisma.serviceOffer.findFirst.mockResolvedValue({
        ...offer,
        zonePricing: [
          {
            priceOverrideCents: null,
            vehicleSurcharges: {
              citadine: 0,
              berline: 500,
              suv: 1000,
              utilitaire: 1500,
              moto: 0,
            },
            zone: { slug: 'lyon', isActive: true },
          },
        ],
      });

      await expect(
        service.quote({
          offerId: offer.id,
          vehicleType: 'suv',
          optionIds: ['33333333-3333-4333-8333-333333333333'],
          zoneSlug: 'lyon',
          dirtLevel: 'normal',
        }),
      ).resolves.toEqual({
        data: {
          breakdown: {
            base: 8500,
            vehicleSurcharge: 1000,
            options: [
              {
                id: '33333333-3333-4333-8333-333333333333',
                name: 'Poils animaux',
                amount: 1500,
              },
            ],
            serviceFee: 200,
            totalCents: 11200,
            currency: 'EUR',
          },
          durationMinutes: 105,
        },
      });
    });

    it('applique un prix override de zone si présent', async () => {
      const { service, prisma } = buildService();
      prisma.serviceOffer.findFirst.mockResolvedValue({
        ...offer,
        zonePricing: [
          {
            priceOverrideCents: 9000,
            vehicleSurcharges: { suv: 1000 },
          },
        ],
      });

      const result = await service.quote({
        offerId: offer.id,
        vehicleType: 'suv',
        optionIds: [],
        zoneSlug: 'lyon',
        dirtLevel: 'normal',
      });

      expect(result.data.breakdown.base).toBe(9000);
      expect(result.data.breakdown.totalCents).toBe(10200);
    });

    it('rejette une offre inexistante', async () => {
      const { service, prisma } = buildService();
      prisma.serviceOffer.findFirst.mockResolvedValue(null);

      await expect(
        service.quote({
          offerId: offer.id,
          vehicleType: 'suv',
          optionIds: [],
          zoneSlug: 'lyon',
          dirtLevel: 'normal',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejette une offre non disponible dans la zone demandée', async () => {
      const { service, prisma } = buildService();
      prisma.serviceOffer.findFirst.mockResolvedValue({
        ...offer,
        zonePricing: [],
      });

      await expect(
        service.quote({
          offerId: offer.id,
          vehicleType: 'suv',
          optionIds: [],
          zoneSlug: 'lyon',
          dirtLevel: 'normal',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejette une option inactive ou rattachée à une autre offre', async () => {
      const { service, prisma } = buildService();
      prisma.serviceOffer.findFirst.mockResolvedValue({
        ...offer,
        options: [],
        zonePricing: [{ priceOverrideCents: null, vehicleSurcharges: {} }],
      });

      await expect(
        service.quote({
          offerId: offer.id,
          vehicleType: 'suv',
          optionIds: ['33333333-3333-4333-8333-333333333333'],
          zoneSlug: 'lyon',
          dirtLevel: 'normal',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
