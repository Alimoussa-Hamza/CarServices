import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  Address,
  CreateAddressDto,
  UpdateAddressDto,
} from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rows = await this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: rows.map((row) => this.toDto(row)) };
  }

  async create(userId: string, dto: CreateAddressDto) {
    const created = await this.prisma.address.create({
      data: {
        userId,
        label: dto.label ?? null,
        street: dto.street,
        complement: dto.complement ?? null,
        city: dto.city,
        postalCode: dto.postalCode,
        country: dto.country,
        lat: new Prisma.Decimal(dto.lat.toFixed(7)),
        lng: new Prisma.Decimal(dto.lng.toFixed(7)),
        instructions: dto.instructions ?? null,
      },
    });
    return { data: this.toDto(created) };
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    await this.requireOwned(userId, addressId);
    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.street !== undefined ? { street: dto.street } : {}),
        ...(dto.complement !== undefined ? { complement: dto.complement } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode } : {}),
        ...(dto.country !== undefined ? { country: dto.country } : {}),
        ...(dto.lat !== undefined && dto.lng !== undefined
          ? {
              lat: new Prisma.Decimal(dto.lat.toFixed(7)),
              lng: new Prisma.Decimal(dto.lng.toFixed(7)),
            }
          : {}),
        ...(dto.instructions !== undefined
          ? { instructions: dto.instructions }
          : {}),
      },
    });
    return { data: this.toDto(updated) };
  }

  async remove(userId: string, addressId: string) {
    await this.requireOwned(userId, addressId);
    const asBase = await this.prisma.providerProfile.findFirst({
      where: { baseAddressId: addressId },
      select: { id: true },
    });
    if (asBase) {
      throw new ConflictException({
        code: 'ADDRESS_IN_USE',
        message: 'Cette adresse est utilisée comme base prestataire.',
        details: [],
      });
    }

    await this.prisma.address.delete({ where: { id: addressId } });
    return { data: { id: addressId, deleted: true as const } };
  }

  private async requireOwned(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });
    if (!address) {
      throw new NotFoundException({
        code: 'ADDRESS_NOT_FOUND',
        message: 'Adresse introuvable.',
        details: [],
      });
    }
  }

  private toDto(row: {
    id: string;
    label: string | null;
    street: string;
    complement: string | null;
    city: string;
    postalCode: string;
    country: string;
    lat: Prisma.Decimal | number;
    lng: Prisma.Decimal | number;
    instructions: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Address {
    return {
      id: row.id,
      label: row.label,
      street: row.street,
      complement: row.complement,
      city: row.city,
      postalCode: row.postalCode,
      country: row.country,
      lat: Number(row.lat),
      lng: Number(row.lng),
      instructions: row.instructions,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
