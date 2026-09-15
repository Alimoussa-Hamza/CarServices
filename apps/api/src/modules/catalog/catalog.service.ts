import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CatalogQuoteDto, VehicleType } from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

const SERVICE_FEE_CENTS = 200;

type VehicleSurcharges = Partial<Record<VehicleType, number>>;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isEnabled: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return {
      data: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        icon: category.icon,
      })),
    };
  }

  async listOffers(zoneSlug?: string) {
    const zone = zoneSlug
      ? await this.prisma.serviceZone.findUnique({ where: { slug: zoneSlug } })
      : null;

    if (zoneSlug && (!zone || !zone.isActive)) {
      return { data: [] };
    }

    const offers = await this.prisma.serviceOffer.findMany({
      where: {
        isActive: true,
        category: { isEnabled: true },
        ...(zone
          ? {
              zonePricing: {
                some: { zoneId: zone.id },
              },
            }
          : {}),
      },
      include: {
        category: true,
        options: { where: { isActive: true }, orderBy: { name: 'asc' } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return { data: offers.map((offer) => this.toOfferDto(offer)) };
  }

  async getOffer(offerId: string) {
    const offer = await this.prisma.serviceOffer.findFirst({
      where: { id: offerId, isActive: true, category: { isEnabled: true } },
      include: {
        category: true,
        options: { where: { isActive: true }, orderBy: { name: 'asc' } },
      },
    });

    if (!offer) {
      throw new NotFoundException({
        code: 'OFFER_NOT_FOUND',
        message: 'Offre introuvable.',
        details: [],
      });
    }

    return { data: this.toOfferDto(offer) };
  }

  async computeQuote(dto: CatalogQuoteDto) {
    const offer = await this.prisma.serviceOffer.findFirst({
      where: { id: dto.offerId, isActive: true, category: { isEnabled: true } },
      include: {
        category: true,
        options: { where: { isActive: true } },
        zonePricing: {
          where: { zone: { slug: dto.zoneSlug, isActive: true } },
          include: { zone: true },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException({
        code: 'OFFER_NOT_FOUND',
        message: 'Offre introuvable.',
        details: [],
      });
    }

    const pricing = offer.zonePricing[0];
    if (!pricing) {
      throw new BadRequestException({
        code: 'ZONE_NOT_COVERED',
        message: "Cette offre n'est pas disponible dans cette zone.",
        details: [],
      });
    }

    const selectedOptions = offer.options.filter((option) =>
      dto.optionIds.includes(option.id),
    );

    if (selectedOptions.length !== dto.optionIds.length) {
      throw new BadRequestException({
        code: 'INVALID_OPTIONS',
        message: 'Une ou plusieurs options ne sont pas disponibles.',
        details: [],
      });
    }

    const base = pricing.priceOverrideCents ?? offer.basePriceCents;
    const vehicleSurcharge = this.getVehicleSurcharge(
      pricing.vehicleSurcharges,
      dto.vehicleType,
    );
    const options = selectedOptions.map((option) => ({
      id: option.id,
      name: option.name,
      amount: option.priceDeltaCents,
    }));
    const optionsTotal = options.reduce((total, option) => total + option.amount, 0);
    const durationMinutes =
      offer.durationMinutes +
      selectedOptions.reduce(
        (total, option) => total + option.durationDeltaMinutes,
        0,
      );

    return {
      breakdown: {
        base,
        vehicleSurcharge,
        options,
        serviceFee: SERVICE_FEE_CENTS,
        totalCents: base + vehicleSurcharge + optionsTotal + SERVICE_FEE_CENTS,
        currency: 'EUR' as const,
      },
      durationMinutes,
      offer: {
        id: offer.id,
        name: offer.name,
        categorySlug: offer.category.slug,
      },
    };
  }

  async quote(dto: CatalogQuoteDto) {
    const { breakdown, durationMinutes } = await this.computeQuote(dto);
    return { data: { breakdown, durationMinutes } };
  }

  private getVehicleSurcharge(
    vehicleSurcharges: unknown,
    vehicleType: VehicleType,
  ): number {
    if (!vehicleSurcharges || typeof vehicleSurcharges !== 'object') {
      return 0;
    }

    const value = (vehicleSurcharges as VehicleSurcharges)[vehicleType];
    return typeof value === 'number' && value > 0 ? value : 0;
  }

  private toOfferDto(offer: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    basePriceCents: number;
    durationMinutes: number;
    category: { slug: string; name: string };
    options: Array<{
      id: string;
      slug: string;
      name: string;
      priceDeltaCents: number;
      durationDeltaMinutes: number;
    }>;
  }) {
    return {
      id: offer.id,
      slug: offer.slug,
      name: offer.name,
      description: offer.description,
      basePriceCents: offer.basePriceCents,
      durationMinutes: offer.durationMinutes,
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
      })),
    };
  }
}
