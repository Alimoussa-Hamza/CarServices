import { BadRequestException, Injectable } from '@nestjs/common';
import { OutOfZoneLeadDto, ZoneCheckDto } from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

type ZoneRow = {
  id: string;
  name: string;
  slug: string;
};

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async check(dto: ZoneCheckDto) {
    const zones = await this.prisma.$queryRaw<ZoneRow[]>`
      SELECT id::text, name, slug
      FROM service_zones
      WHERE is_active = true
        AND ST_Intersects(
          polygon,
          ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326)::geography
        )
      ORDER BY name ASC
      LIMIT 1
    `;

    const zone = zones[0];

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
        zone,
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
