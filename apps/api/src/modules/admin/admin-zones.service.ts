import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AdminCreateZoneDto,
  AdminGeoPoint,
  AdminUpdateZoneDto,
  AdminUpsertZonePricingDto,
  AdminZone,
  AdminZonePricing,
  VehicleSurcharges,
  VehicleSurchargesSchema,
} from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

type ZoneRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  price_coefficient: string | number;
  min_booking_lead_hours: number;
  created_at: Date;
  geojson: string | { type: string; coordinates: number[][][] };
};

@Injectable()
export class AdminZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async listZones() {
    const rows = await this.prisma.$queryRaw<ZoneRow[]>`
      SELECT
        id::text,
        name,
        slug,
        is_active,
        price_coefficient,
        min_booking_lead_hours,
        created_at,
        ST_AsGeoJSON(polygon::geometry)::json AS geojson
      FROM service_zones
      ORDER BY name ASC
    `;

    return { data: rows.map((row) => this.toAdminZone(row)) };
  }

  async getZone(zoneId: string) {
    const rows = await this.prisma.$queryRaw<ZoneRow[]>`
      SELECT
        id::text,
        name,
        slug,
        is_active,
        price_coefficient,
        min_booking_lead_hours,
        created_at,
        ST_AsGeoJSON(polygon::geometry)::json AS geojson
      FROM service_zones
      WHERE id = ${zoneId}::uuid
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) {
      throw new NotFoundException({
        code: 'ZONE_NOT_FOUND',
        message: 'Zone introuvable.',
        details: [],
      });
    }

    return { data: this.toAdminZone(row) };
  }

  async createZone(dto: AdminCreateZoneDto) {
    await this.assertSlugAvailable(dto.slug);
    const wkt = polygonToWkt(dto.polygon);

    const rows = await this.prisma.$queryRaw<ZoneRow[]>`
      INSERT INTO service_zones (
        id, name, slug, polygon, is_active, price_coefficient, min_booking_lead_hours, created_at
      )
      VALUES (
        gen_random_uuid(),
        ${dto.name},
        ${dto.slug},
        ST_GeogFromText(${wkt}),
        ${dto.isActive},
        ${dto.priceCoefficient},
        ${dto.minBookingLeadHours},
        now()
      )
      RETURNING
        id::text,
        name,
        slug,
        is_active,
        price_coefficient,
        min_booking_lead_hours,
        created_at,
        ST_AsGeoJSON(polygon::geometry)::json AS geojson
    `;

    const row = rows[0];
    if (!row) {
      throw new BadRequestException({
        code: 'ZONE_CREATE_FAILED',
        message: 'Impossible de créer la zone.',
        details: [],
      });
    }

    return { data: this.toAdminZone(row) };
  }

  async updateZone(zoneId: string, dto: AdminUpdateZoneDto) {
    await this.requireZone(zoneId);
    if (dto.slug) {
      await this.assertSlugAvailable(dto.slug, zoneId);
    }

    const current = await this.getZone(zoneId);
    const name = dto.name ?? current.data.name;
    const slug = dto.slug ?? current.data.slug;
    const isActive = dto.isActive ?? current.data.isActive;
    const priceCoefficient =
      dto.priceCoefficient ?? current.data.priceCoefficient;
    const minBookingLeadHours =
      dto.minBookingLeadHours ?? current.data.minBookingLeadHours;
    const wkt = polygonToWkt(dto.polygon ?? current.data.polygon);

    const rows = await this.prisma.$queryRaw<ZoneRow[]>`
      UPDATE service_zones
      SET
        name = ${name},
        slug = ${slug},
        polygon = ST_GeogFromText(${wkt}),
        is_active = ${isActive},
        price_coefficient = ${priceCoefficient},
        min_booking_lead_hours = ${minBookingLeadHours}
      WHERE id = ${zoneId}::uuid
      RETURNING
        id::text,
        name,
        slug,
        is_active,
        price_coefficient,
        min_booking_lead_hours,
        created_at,
        ST_AsGeoJSON(polygon::geometry)::json AS geojson
    `;

    const row = rows[0];
    if (!row) {
      throw new NotFoundException({
        code: 'ZONE_NOT_FOUND',
        message: 'Zone introuvable.',
        details: [],
      });
    }

    return { data: this.toAdminZone(row) };
  }

  async listPricing(zoneId: string) {
    await this.requireZone(zoneId);
    const rows = await this.prisma.zonePricing.findMany({
      where: { zoneId },
      include: { offer: { select: { slug: true, name: true } } },
      orderBy: { offer: { sortOrder: 'asc' } },
    });

    return {
      data: rows.map((row) => this.toPricingDto(row)),
    };
  }

  async upsertPricing(
    zoneId: string,
    offerId: string,
    dto: AdminUpsertZonePricingDto,
  ) {
    await this.requireZone(zoneId);
    const offer = await this.prisma.serviceOffer.findUnique({
      where: { id: offerId },
      select: { id: true, slug: true, name: true },
    });
    if (!offer) {
      throw new NotFoundException({
        code: 'OFFER_NOT_FOUND',
        message: 'Offre introuvable.',
        details: [],
      });
    }

    const updated = await this.prisma.zonePricing.upsert({
      where: { zoneId_offerId: { zoneId, offerId } },
      create: {
        zoneId,
        offerId,
        priceOverrideCents: dto.priceOverrideCents ?? null,
        vehicleSurcharges: dto.vehicleSurcharges as Prisma.InputJsonValue,
      },
      update: {
        ...(dto.priceOverrideCents !== undefined
          ? { priceOverrideCents: dto.priceOverrideCents }
          : {}),
        vehicleSurcharges: dto.vehicleSurcharges as Prisma.InputJsonValue,
      },
      include: { offer: { select: { slug: true, name: true } } },
    });

    return { data: this.toPricingDto(updated) };
  }

  private toPricingDto(row: {
    zoneId: string;
    offerId: string;
    priceOverrideCents: number | null;
    vehicleSurcharges: unknown;
    offer: { slug: string; name: string };
  }): AdminZonePricing {
    return {
      zoneId: row.zoneId,
      offerId: row.offerId,
      offerSlug: row.offer.slug,
      offerName: row.offer.name,
      priceOverrideCents: row.priceOverrideCents,
      vehicleSurcharges: normalizeSurcharges(row.vehicleSurcharges),
    };
  }

  private toAdminZone(row: ZoneRow): AdminZone {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      isActive: row.is_active,
      priceCoefficient: Number(row.price_coefficient),
      minBookingLeadHours: row.min_booking_lead_hours,
      polygon: geoJsonToPoints(row.geojson),
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  private async requireZone(zoneId: string) {
    const zone = await this.prisma.serviceZone.findUnique({
      where: { id: zoneId },
      select: { id: true },
    });
    if (!zone) {
      throw new NotFoundException({
        code: 'ZONE_NOT_FOUND',
        message: 'Zone introuvable.',
        details: [],
      });
    }
  }

  private async assertSlugAvailable(slug: string, excludeId?: string) {
    const existing = await this.prisma.serviceZone.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException({
        code: 'ZONE_SLUG_TAKEN',
        message: 'Ce slug de zone est déjà utilisé.',
        details: [{ slug }],
      });
    }
  }
}

export function polygonToWkt(points: AdminGeoPoint[]): string {
  const ring = [...points];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (
    first &&
    last &&
    (first.lat !== last.lat || first.lng !== last.lng)
  ) {
    ring.push({ ...first });
  }

  const coords = ring.map((point) => `${point.lng} ${point.lat}`).join(', ');
  return `POLYGON((${coords}))`;
}

function geoJsonToPoints(
  geojson: string | { type: string; coordinates: number[][][] },
): AdminGeoPoint[] {
  const parsed =
    typeof geojson === 'string'
      ? (JSON.parse(geojson) as { coordinates: number[][][] })
      : geojson;
  const ring = parsed.coordinates[0] ?? [];
  const points = ring.map(([lng, lat]) => ({
    lat: Number(lat),
    lng: Number(lng),
  }));

  if (points.length >= 2) {
    const first = points[0];
    const last = points[points.length - 1];
    if (
      first &&
      last &&
      first.lat === last.lat &&
      first.lng === last.lng
    ) {
      points.pop();
    }
  }

  return points;
}

function normalizeSurcharges(value: unknown): VehicleSurcharges {
  const parsed = VehicleSurchargesSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  return {
    citadine: 0,
    berline: 0,
    suv: 0,
    utilitaire: 0,
    moto: 0,
  };
}
