import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminZonesService, polygonToWkt } from '../admin-zones.service';

const zoneId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const offerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const lyonPolygon = [
  { lat: 45.707, lng: 4.771 },
  { lat: 45.707, lng: 4.902 },
  { lat: 45.815, lng: 4.902 },
  { lat: 45.815, lng: 4.771 },
];

function buildService() {
  const prisma = {
    $queryRaw: jest.fn(),
    serviceZone: {
      findUnique: jest.fn(),
    },
    serviceOffer: {
      findUnique: jest.fn(),
    },
    zonePricing: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  return {
    service: new AdminZonesService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('polygonToWkt', () => {
  it('ferme le ring et utilise lng lat', () => {
    expect(polygonToWkt(lyonPolygon)).toBe(
      'POLYGON((4.771 45.707, 4.902 45.707, 4.902 45.815, 4.771 45.815, 4.771 45.707))',
    );
  });
});

describe('AdminZonesService', () => {
  it('liste les zones avec polygone', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw.mockResolvedValue([
      {
        id: zoneId,
        name: 'Lyon',
        slug: 'lyon',
        is_active: true,
        price_coefficient: '1.00',
        min_booking_lead_hours: 2,
        created_at: new Date('2026-09-16T10:00:00.000Z'),
        geojson: {
          type: 'Polygon',
          coordinates: [
            [
              [4.771, 45.707],
              [4.902, 45.707],
              [4.902, 45.815],
              [4.771, 45.815],
              [4.771, 45.707],
            ],
          ],
        },
      },
    ]);

    const result = await service.listZones();
    expect(result.data[0]).toMatchObject({
      id: zoneId,
      slug: 'lyon',
      isActive: true,
      priceCoefficient: 1,
      polygon: lyonPolygon,
    });
  });

  it('crée une zone via WKT', async () => {
    const { service, prisma } = buildService();
    prisma.serviceZone.findUnique.mockResolvedValue(null);
    prisma.$queryRaw.mockResolvedValue([
      {
        id: zoneId,
        name: 'Villeurbanne',
        slug: 'villeurbanne',
        is_active: false,
        price_coefficient: 1.1,
        min_booking_lead_hours: 3,
        created_at: new Date('2026-09-16T10:00:00.000Z'),
        geojson: {
          type: 'Polygon',
          coordinates: [
            [
              [4.85, 45.75],
              [4.9, 45.75],
              [4.9, 45.8],
              [4.85, 45.8],
              [4.85, 45.75],
            ],
          ],
        },
      },
    ]);

    await expect(
      service.createZone({
        name: 'Villeurbanne',
        slug: 'villeurbanne',
        polygon: [
          { lat: 45.75, lng: 4.85 },
          { lat: 45.75, lng: 4.9 },
          { lat: 45.8, lng: 4.9 },
          { lat: 45.8, lng: 4.85 },
        ],
        isActive: false,
        priceCoefficient: 1.1,
        minBookingLeadHours: 3,
      }),
    ).resolves.toMatchObject({
      data: { slug: 'villeurbanne', priceCoefficient: 1.1 },
    });
  });

  it('refuse un slug de zone déjà pris', async () => {
    const { service, prisma } = buildService();
    prisma.serviceZone.findUnique.mockResolvedValue({ id: zoneId });

    await expect(
      service.createZone({
        name: 'Dup',
        slug: 'lyon',
        polygon: lyonPolygon,
        isActive: true,
        priceCoefficient: 1,
        minBookingLeadHours: 2,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('upsert le pricing zone/offre', async () => {
    const { service, prisma } = buildService();
    prisma.serviceZone.findUnique.mockResolvedValue({ id: zoneId });
    prisma.serviceOffer.findUnique.mockResolvedValue({
      id: offerId,
      slug: 'wash-complete',
      name: 'Lavage complet',
    });
    prisma.zonePricing.upsert.mockResolvedValue({
      zoneId,
      offerId,
      priceOverrideCents: 9000,
      vehicleSurcharges: {
        citadine: 0,
        berline: 500,
        suv: 1000,
        utilitaire: 1500,
        moto: 0,
      },
      offer: { slug: 'wash-complete', name: 'Lavage complet' },
    });

    await expect(
      service.upsertPricing(zoneId, offerId, {
        priceOverrideCents: 9000,
        vehicleSurcharges: {
          citadine: 0,
          berline: 500,
          suv: 1000,
          utilitaire: 1500,
          moto: 0,
        },
      }),
    ).resolves.toMatchObject({
      data: {
        offerSlug: 'wash-complete',
        priceOverrideCents: 9000,
        vehicleSurcharges: { suv: 1000 },
      },
    });
  });

  it('404 si offre absente pour pricing', async () => {
    const { service, prisma } = buildService();
    prisma.serviceZone.findUnique.mockResolvedValue({ id: zoneId });
    prisma.serviceOffer.findUnique.mockResolvedValue(null);

    await expect(
      service.upsertPricing(zoneId, offerId, {
        vehicleSurcharges: {
          citadine: 0,
          berline: 0,
          suv: 0,
          utilitaire: 0,
          moto: 0,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
