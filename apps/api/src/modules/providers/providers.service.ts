import { Injectable } from '@nestjs/common';
import { UpdateProviderProfileDto } from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const profile = await this.prisma.providerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return { data: this.toProviderProfileDto(profile) };
  }

  async updateMe(userId: string, dto: UpdateProviderProfileDto) {
    const profile = await this.prisma.providerProfile.upsert({
      where: { userId },
      update: {
        companyName: dto.companyName,
        siret: dto.siret,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        washMethods: dto.washMethods,
        baseAddressId: dto.baseAddressId,
      },
      create: {
        userId,
        companyName: dto.companyName,
        siret: dto.siret,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        washMethods: dto.washMethods ?? [],
        baseAddressId: dto.baseAddressId,
      },
    });

    return { data: this.toProviderProfileDto(profile) };
  }

  private toProviderProfileDto(profile: {
    id: string;
    userId: string;
    companyName: string | null;
    siret: string | null;
    bio: string | null;
    avatarUrl: string | null;
    kycStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
    kycRejectionReason: string | null;
    washMethods: Array<'waterless' | 'steam'>;
    ratingAvg: unknown;
    ratingCount: number;
    acceptanceRate: unknown;
    stripeAccountId: string | null;
    baseAddressId: string | null;
  }) {
    return {
      id: profile.id,
      userId: profile.userId,
      companyName: profile.companyName,
      siret: profile.siret,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      kycStatus: profile.kycStatus,
      kycRejectionReason: profile.kycRejectionReason,
      washMethods: profile.washMethods,
      ratingAvg: this.decimalToNumber(profile.ratingAvg),
      ratingCount: profile.ratingCount,
      acceptanceRate: this.decimalToNumber(profile.acceptanceRate),
      stripeAccountId: profile.stripeAccountId,
      baseAddressId: profile.baseAddressId,
    };
  }

  private decimalToNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    if (
      value &&
      typeof value === 'object' &&
      'toNumber' in value &&
      typeof value.toNumber === 'function'
    ) {
      return value.toNumber();
    }

    return Number(value);
  }
}
