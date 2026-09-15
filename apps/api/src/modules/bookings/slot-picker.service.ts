import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  SLOT_PICKER_HORIZON_DAYS,
  type SlotPickerRequest,
  type SlotPickerResponse,
} from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { ZonesService } from '../zones/zones.service';
import { BookingMatchingService } from './booking-matching.service';
import { buildSlotGrid, slotHasCapacity, utcDayStart } from './slot-picker';

@Injectable()
export class SlotPickerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: CatalogService,
    private readonly zonesService: ZonesService,
    private readonly matchingService: BookingMatchingService,
  ) {}

  async listSlots(
    userId: string,
    dto: SlotPickerRequest,
    now = new Date(),
  ): Promise<{ data: SlotPickerResponse }> {
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });

    if (!address) {
      throw new NotFoundException({
        code: 'ADDRESS_NOT_FOUND',
        message: 'Adresse introuvable.',
        details: [],
      });
    }

    const lat = Number(address.lat);
    const lng = Number(address.lng);
    const zone = await this.zonesService.findCoveringZone(lat, lng);

    if (!zone) {
      throw new BadRequestException({
        code: 'ZONE_NOT_COVERED',
        message: "Cette adresse n'est pas encore couverte.",
        details: [],
      });
    }

    const quote = await this.catalogService.computeQuote({
      offerId: dto.offerId,
      vehicleType: dto.vehicleType,
      optionIds: dto.optionIds,
      zoneSlug: zone.slug,
      dirtLevel: 'normal',
    });

    const origin = utcDayStart(now);
    const horizonEnd = new Date(
      origin.getTime() + (SLOT_PICKER_HORIZON_DAYS + 1) * 24 * 60 * 60 * 1000,
    );

    const pool = await this.matchingService.loadCapacityPool({
      offerId: dto.offerId,
      zoneId: zone.id,
      destination: { lat, lng },
      horizonStart: origin,
      horizonEnd,
      now,
    });

    const days = buildSlotGrid({
      now,
      durationMinutes: quote.durationMinutes,
      leadHours: zone.minBookingLeadHours,
    }).map((day) => ({
      date: day.date,
      slots: day.slots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        available: slotHasCapacity(slot, pool),
      })),
    }));

    return {
      data: {
        durationMinutes: quote.durationMinutes,
        minBookingLeadHours: zone.minBookingLeadHours,
        horizonDays: SLOT_PICKER_HORIZON_DAYS,
        zone: { slug: zone.slug, name: zone.name },
        days,
      },
    };
  }
}
