import { BadRequestException, Injectable } from '@nestjs/common';
import { OutOfZoneLeadDto, ZoneCheckDto } from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

export type CoveringZone = {
  id: string;
  name: string;
  slug: string;
  minBookingLeadHours: number;
};

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findCoveringZone(lat: number, lng: number): Promise<CoveringZone | null> {
    const zones = await this.prisma.$queryRaw<CoveringZone[]>`
      SELECT id::text, name, slug, min_booking_lead_hours AS "minBookingLeadHours"
      FROM service_zones
      WHERE is_active = true
        AND ST_Intersects(
          polygon,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        )
      ORDER BY name ASC
      LIMIT 1
    `;

    return zones[0] ?? null;
  }

  async check(dto: ZoneCheckDto) {
    const zone = await this.findCoveringZone(dto.lat, dto.lng);

    if (!zone) {
      return {
        data: {
          covered: false as const,
          leadCaptured: false,
        },
      };
    }

    return {
      data: {
        covered: true as const,
        zone: {
          id: zone.id,
          name: zone.name,
          slug: zone.slug,
        },
      },
    };
  }

  async createLead(dto: OutOfZoneLeadDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException({
        code: 'CONTACT_REQUIRED',
        message: 'Un email ou un téléphone est requis.',
        details: [],
      });
    }

    const lead = await this.prisma.outOfZoneLead.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        lat: dto.lat,
        lng: dto.lng,
        addressText: dto.addressText,
      },
    });

    return {
      data: {
        id: lead.id,
        captured: true,
      },
    };
  }
}
