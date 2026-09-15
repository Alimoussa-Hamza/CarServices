import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminCatalogService } from '../admin-catalog.service';

const categoryId = '11111111-1111-4111-8111-111111111111';
const offerId = '22222222-2222-4222-8222-222222222222';
const optionId = '33333333-3333-4333-8333-333333333333';

function buildService() {
  const prisma = {
    serviceCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    serviceOffer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    offerOption: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    service: new AdminCatalogService(prisma as unknown as PrismaService),
    prisma,
  };
}

const offerRow = {
  id: offerId,
  categoryId,
  slug: 'wash-complete',
  name: 'Lavage complet',
  description: 'Intérieur + extérieur',
  basePriceCents: 8500,
  durationMinutes: 90,
  formSchema: { fields: [] },
  checklistTemplate: { items: [] },
  isActive: true,
  sortOrder: 1,
  category: { slug: 'wash', name: 'Lavage auto' },
  options: [
    {
      id: optionId,
      slug: 'pet-hair',
      name: 'Poils animaux',
      priceDeltaCents: 1500,
      durationDeltaMinutes: 15,
      isActive: true,
    },
  ],
};

describe('AdminCatalogService', () => {
  it('liste les catégories y compris désactivées', async () => {
    const { service, prisma } = buildService();
    prisma.serviceCategory.findMany.mockResolvedValue([
      {
        id: categoryId,
        slug: 'wash',
        name: 'Lavage auto',
        description: null,
        icon: 'sparkles',
        isEnabled: true,
        sortOrder: 1,
      },
    ]);

    await expect(service.listCategories()).resolves.toEqual({
      data: [
        expect.objectContaining({
          id: categoryId,
          isEnabled: true,
          sortOrder: 1,
        }),
      ],
    });
  });

  it('désactive une catégorie (soft)', async () => {
    const { service, prisma } = buildService();
    prisma.serviceCategory.findUnique.mockResolvedValue({ id: categoryId });
    prisma.serviceCategory.update.mockResolvedValue({
      id: categoryId,
      slug: 'wash',
      name: 'Lavage auto',
      description: null,
      icon: null,
      isEnabled: false,
      sortOrder: 1,
    });

    await expect(
      service.updateCategory(categoryId, { isEnabled: false }),
    ).resolves.toMatchObject({ data: { isEnabled: false } });
  });

  it('crée une offre puis la désactive sans supprimer', async () => {
    const { service, prisma } = buildService();
    prisma.serviceCategory.findUnique.mockResolvedValue({ id: categoryId });
    prisma.serviceOffer.findUnique.mockResolvedValue(null);
    prisma.serviceOffer.create.mockResolvedValue(offerRow);
    prisma.serviceOffer.update.mockResolvedValue({
      ...offerRow,
      isActive: false,
    });

    await expect(
      service.createOffer({
        categoryId,
        slug: 'wash-premium',
        name: 'Lavage premium',
        basePriceCents: 12000,
        durationMinutes: 120,
        formSchema: { fields: [] },
        checklistTemplate: { items: [] },
        isActive: true,
        sortOrder: 10,
      }),
    ).resolves.toMatchObject({ data: { slug: 'wash-complete', isActive: true } });

    prisma.serviceOffer.findUnique.mockResolvedValue({ id: offerId });

    await expect(
      service.updateOffer(offerId, { isActive: false }),
    ).resolves.toMatchObject({ data: { isActive: false } });
  });

  it('refuse un slug d’offre déjà pris', async () => {
    const { service, prisma } = buildService();
    prisma.serviceCategory.findUnique.mockResolvedValue({ id: categoryId });
    prisma.serviceOffer.findUnique.mockResolvedValue({ id: offerId });

    await expect(
      service.createOffer({
        categoryId,
        slug: 'wash-complete',
        name: 'Dup',
        basePriceCents: 1000,
        durationMinutes: 30,
        formSchema: {},
        checklistTemplate: {},
        isActive: true,
        sortOrder: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('crée et désactive une option', async () => {
    const { service, prisma } = buildService();
    prisma.serviceOffer.findUnique.mockResolvedValue({ id: offerId });
    prisma.offerOption.findUnique.mockResolvedValue(null);
    prisma.offerOption.create.mockResolvedValue({
      id: optionId,
      slug: 'ozone',
      name: 'Traitement ozone',
      priceDeltaCents: 2000,
      durationDeltaMinutes: 20,
      isActive: true,
    });
    prisma.offerOption.update.mockResolvedValue({
      id: optionId,
      slug: 'ozone',
      name: 'Traitement ozone',
      priceDeltaCents: 2000,
      durationDeltaMinutes: 20,
      isActive: false,
    });

    await expect(
      service.createOption(offerId, {
        slug: 'ozone',
        name: 'Traitement ozone',
        priceDeltaCents: 2000,
        durationDeltaMinutes: 20,
        isActive: true,
      }),
    ).resolves.toMatchObject({ data: { slug: 'ozone' } });

    prisma.offerOption.findUnique.mockResolvedValue({
      id: optionId,
      offerId,
      slug: 'ozone',
    });

    await expect(
      service.updateOption(optionId, { isActive: false }),
    ).resolves.toMatchObject({ data: { isActive: false } });
  });

  it('404 si offre inconnue', async () => {
    const { service, prisma } = buildService();
    prisma.serviceOffer.findUnique.mockResolvedValue(null);
    await expect(service.getOffer(offerId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
