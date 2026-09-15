import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CatalogService } from '../../catalog/catalog.service';
import { ZonesService } from '../../zones/zones.service';
import { BookingMatchingService } from '../booking-matching.service';
import { SlotPickerService } from '../slot-picker.service';
import { PrismaService } from '../../../prisma/prisma.service';

const userId = '11111111-1111-4111-8111-111111111111';
const addressId = '33333333-3333-4333-8333-333333333333';
const offerId = '44444444-4444-4444-8444-444444444444';
const now = new Date('2026-09-15T10:00:00.000Z');

const dto = {
  offerId,
  vehicleType: 'suv' as const,
  optionIds: [] as string[],
  addressId,
};

describe('SlotPickerService', () => {
  function buildService() {
    const prisma = {
      address: { findFirst: jest.fn() },
    };
    const catalogService = {
      computeQuote: jest.fn().mockResolvedValue({ durationMinutes: 90 }),
    };
    const zonesService = {
      findCoveringZone: jest.fn().mockResolvedValue({
        id: 'zone-1',
        name: 'Lyon',
        slug: 'lyon',
        minBookingLeadHours: 2,
      }),
    };
    const matchingService = {
      loadCapacityPool: jest.fn().mockResolvedValue([
        {
          availability: [
            {
              dayOfWeek: 2,
              startTime: new Date('1970-01-01T08:00:00.000Z'),
              endTime: new Date('1970-01-01T18:00:00.000Z'),
              isActive: true,
            },
          ],
          blockedSlots: [],
          busyRanges: [],
          distanceKm: 2,
          radiusKm: 25,
        },
      ]),
    };

    prisma.address.findFirst.mockResolvedValue({
      id: addressId,
      userId,
      lat: 45.764,
      lng: 4.835,
    });

    return {
      service: new SlotPickerService(
        prisma as unknown as PrismaService,
        catalogService as unknown as CatalogService,
        zonesService as unknown as ZonesService,
        matchingService as unknown as BookingMatchingService,
      ),
      prisma,
      catalogService,
      zonesService,
      matchingService,
    };
  }

  it('retourne J→J+14 avec capacité zone (RG-MATCH-01)', async () => {
    const { service, matchingService, catalogService } = buildService();

    const result = await service.listSlots(userId, dto, now);

    expect(result.data.horizonDays).toBe(14);
    expect(result.data.days).toHaveLength(15);
    expect(result.data.durationMinutes).toBe(90);
    expect(result.data.zone.slug).toBe('lyon');
    expect(result.data.days[0]?.date).toBe('2026-09-15');
    expect(
      result.data.days[0]?.slots.some((slot) => slot.available),
    ).toBe(true);
    expect(catalogService.computeQuote).toHaveBeenCalledWith(
      expect.objectContaining({ offerId, zoneSlug: 'lyon' }),
    );
    expect(matchingService.loadCapacityPool).toHaveBeenCalled();
  });

  it('404 si l’adresse n’appartient pas au client', async () => {
    const { service, prisma } = buildService();
    prisma.address.findFirst.mockResolvedValue(null);

    await expect(service.listSlots(userId, dto, now)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('400 si la zone n’est pas couverte', async () => {
    const { service, zonesService } = buildService();
    zonesService.findCoveringZone.mockResolvedValue(null);

    await expect(service.listSlots(userId, dto, now)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
