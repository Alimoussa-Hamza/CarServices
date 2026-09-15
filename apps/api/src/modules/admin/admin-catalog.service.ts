import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AdminCreateOfferDto,
  AdminCreateOfferOptionDto,
  AdminOffer,
  AdminUpdateCategoryDto,
  AdminUpdateOfferDto,
  AdminUpdateOfferOptionDto,
} from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.serviceCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return {
      data: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        icon: category.icon,
        isEnabled: category.isEnabled,
        sortOrder: category.sortOrder,
      })),
    };
  }

  async updateCategory(categoryId: string, dto: AdminUpdateCategoryDto) {
    await this.requireCategory(categoryId);
    const updated = await this.prisma.serviceCategory.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });

    return {
      data: {
        id: updated.id,
        slug: updated.slug,
        name: updated.name,
        description: updated.description,
        icon: updated.icon,
        isEnabled: updated.isEnabled,
        sortOrder: updated.sortOrder,
      },
    };
  }

  async listOffers() {
    const offers = await this.prisma.serviceOffer.findMany({
      include: {
        category: true,
        options: { orderBy: { name: 'asc' } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return { data: offers.map((offer) => this.toAdminOffer(offer)) };
  }

  async getOffer(offerId: string) {
    const offer = await this.prisma.serviceOffer.findUnique({
      where: { id: offerId },
      include: {
        category: true,
        options: { orderBy: { name: 'asc' } },
      },
    });

    if (!offer) {
      throw new NotFoundException({
        code: 'OFFER_NOT_FOUND',
        message: 'Offre introuvable.',
        details: [],
      });
    }

    return { data: this.toAdminOffer(offer) };
  }

  async createOffer(dto: AdminCreateOfferDto) {
    await this.requireCategory(dto.categoryId);
    await this.assertOfferSlugAvailable(dto.slug);

    const created = await this.prisma.serviceOffer.create({
      data: {
        categoryId: dto.categoryId,
        slug: dto.slug,
        name: dto.name,
        description: dto.description ?? null,
        basePriceCents: dto.basePriceCents,
        durationMinutes: dto.durationMinutes,
        formSchema: dto.formSchema as Prisma.InputJsonValue,
        checklistTemplate: dto.checklistTemplate as Prisma.InputJsonValue,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
      include: {
        category: true,
        options: { orderBy: { name: 'asc' } },
      },
    });

    return { data: this.toAdminOffer(created) };
  }

  async updateOffer(offerId: string, dto: AdminUpdateOfferDto) {
    await this.requireOffer(offerId);
    if (dto.categoryId) {
      await this.requireCategory(dto.categoryId);
    }
    if (dto.slug) {
      await this.assertOfferSlugAvailable(dto.slug, offerId);
    }

    const updated = await this.prisma.serviceOffer.update({
      where: { id: offerId },
      data: {
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.basePriceCents !== undefined
          ? { basePriceCents: dto.basePriceCents }
          : {}),
        ...(dto.durationMinutes !== undefined
          ? { durationMinutes: dto.durationMinutes }
          : {}),
        ...(dto.formSchema !== undefined
          ? { formSchema: dto.formSchema as Prisma.InputJsonValue }
          : {}),
        ...(dto.checklistTemplate !== undefined
          ? {
              checklistTemplate: dto.checklistTemplate as Prisma.InputJsonValue,
            }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
      include: {
        category: true,
        options: { orderBy: { name: 'asc' } },
      },
    });

    return { data: this.toAdminOffer(updated) };
  }

  async createOption(offerId: string, dto: AdminCreateOfferOptionDto) {
    await this.requireOffer(offerId);
    await this.assertOptionSlugAvailable(offerId, dto.slug);

    const created = await this.prisma.offerOption.create({
      data: {
        offerId,
        slug: dto.slug,
        name: dto.name,
        priceDeltaCents: dto.priceDeltaCents,
        durationDeltaMinutes: dto.durationDeltaMinutes,
        isActive: dto.isActive,
      },
    });

    return {
      data: {
        id: created.id,
        slug: created.slug,
        name: created.name,
        priceDeltaCents: created.priceDeltaCents,
        durationDeltaMinutes: created.durationDeltaMinutes,
        isActive: created.isActive,
      },
    };
  }

  async updateOption(optionId: string, dto: AdminUpdateOfferOptionDto) {
    const option = await this.prisma.offerOption.findUnique({
      where: { id: optionId },
    });
    if (!option) {
      throw new NotFoundException({
        code: 'OPTION_NOT_FOUND',
        message: 'Option introuvable.',
        details: [],
      });
    }

    if (dto.slug) {
      await this.assertOptionSlugAvailable(option.offerId, dto.slug, optionId);
    }

    const updated = await this.prisma.offerOption.update({
      where: { id: optionId },
      data: {
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.priceDeltaCents !== undefined
          ? { priceDeltaCents: dto.priceDeltaCents }
          : {}),
        ...(dto.durationDeltaMinutes !== undefined
          ? { durationDeltaMinutes: dto.durationDeltaMinutes }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return {
      data: {
        id: updated.id,
        slug: updated.slug,
        name: updated.name,
        priceDeltaCents: updated.priceDeltaCents,
        durationDeltaMinutes: updated.durationDeltaMinutes,
        isActive: updated.isActive,
      },
    };
  }

  private toAdminOffer(offer: {
    id: string;
    categoryId: string;
    slug: string;
    name: string;
    description: string | null;
    basePriceCents: number;
    durationMinutes: number;
    formSchema: unknown;
    checklistTemplate: unknown;
    isActive: boolean;
    sortOrder: number;
    category: { slug: string; name: string };
    options: Array<{
      id: string;
      slug: string;
      name: string;
      priceDeltaCents: number;
      durationDeltaMinutes: number;
      isActive: boolean;
    }>;
  }): AdminOffer {
    return {
      id: offer.id,
      categoryId: offer.categoryId,
      slug: offer.slug,
      name: offer.name,
      description: offer.description,
      basePriceCents: offer.basePriceCents,
      durationMinutes: offer.durationMinutes,
      formSchema: offer.formSchema,
      checklistTemplate: offer.checklistTemplate,
      isActive: offer.isActive,
      sortOrder: offer.sortOrder,
      category: {
        slug: offer.category.slug,
        name: offer.category.name,
      },
      options: offer.options.map((option) => ({
        id: option.id,
        slug: option.slug,
        name: option.name,
        priceDeltaCents: option.priceDeltaCents,
        durationDeltaMinutes: option.durationDeltaMinutes,
        isActive: option.isActive,
      })),
    };
  }

  private async requireCategory(categoryId: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Catégorie introuvable.',
        details: [],
      });
    }
  }

  private async requireOffer(offerId: string) {
    const offer = await this.prisma.serviceOffer.findUnique({
      where: { id: offerId },
      select: { id: true },
    });
    if (!offer) {
      throw new NotFoundException({
        code: 'OFFER_NOT_FOUND',
        message: 'Offre introuvable.',
        details: [],
      });
    }
  }

  private async assertOfferSlugAvailable(slug: string, excludeId?: string) {
    const existing = await this.prisma.serviceOffer.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException({
        code: 'OFFER_SLUG_TAKEN',
        message: 'Ce slug d’offre est déjà utilisé.',
        details: [{ slug }],
      });
    }
  }

  private async assertOptionSlugAvailable(
    offerId: string,
    slug: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.offerOption.findUnique({
      where: { offerId_slug: { offerId, slug } },
      select: { id: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException({
        code: 'OPTION_SLUG_TAKEN',
        message: 'Ce slug d’option est déjà utilisé sur cette offre.',
        details: [{ slug }],
      });
    }
  }
}
