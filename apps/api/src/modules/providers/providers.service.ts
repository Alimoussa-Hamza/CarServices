import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { KycStatus } from '@prisma/client';
import {
  SubmitKycDto,
  UpdateProviderProfileDto,
} from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

type KycDocumentRecord = {
  id: string;
  docType: 'rc_pro' | 'identity' | 'other';
  fileUrl: string;
  expiresAt: Date | null;
  verifiedAt: Date | null;
};

type ProviderKycStatusRecord = {
  kycStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
  kycRejectionReason: string | null;
  kycDocuments: KycDocumentRecord[];
};

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
    const profile = await this.translateProviderProfileErrors(() =>
      this.prisma.providerProfile.upsert({
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
      }),
    );

    return { data: this.toProviderProfileDto(profile) };
  }

  async submitKyc(userId: string, dto: SubmitKycDto) {
    const profile = await this.translateProviderProfileErrors(() =>
      this.prisma.$transaction(async (tx) => {
        const currentProfile = await tx.providerProfile.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });

        this.assertKycCanBeSubmitted(currentProfile.kycStatus);

        await tx.providerKycDocument.deleteMany({
          where: { providerId: currentProfile.id },
        });

        await tx.providerKycDocument.createMany({
          data: dto.documents.map((document) => ({
            providerId: currentProfile.id,
            docType: document.docType,
            fileUrl: document.fileUrl,
            expiresAt: document.expiresAt
              ? new Date(`${document.expiresAt}T00:00:00.000Z`)
              : null,
          })),
        });

        return tx.providerProfile.update({
          where: { id: currentProfile.id },
          data: {
            siret: dto.siret,
            washMethods: dto.washMethods,
            kycStatus: KycStatus.submitted,
            kycRejectionReason: null,
          },
          include: {
            kycDocuments: { orderBy: { createdAt: 'asc' } },
          },
        });
      }),
    );

    return { data: this.toKycStatusDto(profile) };
  }

  async getKycStatus(userId: string) {
    const profile = await this.prisma.providerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: {
        kycDocuments: { orderBy: { createdAt: 'asc' } },
      },
    });

    return { data: this.toKycStatusDto(profile) };
  }

  private assertKycCanBeSubmitted(
    status: 'draft' | 'submitted' | 'approved' | 'rejected',
  ): void {
    if (status === 'submitted') {
      throw new BadRequestException({
        code: 'KYC_ALREADY_SUBMITTED',
        message: 'Le dossier KYC est déjà en cours de revue.',
        details: [],
      });
    }

    if (status === 'approved') {
      throw new BadRequestException({
        code: 'KYC_ALREADY_APPROVED',
        message: 'Le dossier KYC est déjà approuvé.',
        details: [],
      });
    }
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

  private toKycStatusDto(profile: ProviderKycStatusRecord) {
    return {
      status: profile.kycStatus,
      rejectionReason: profile.kycRejectionReason,
      documents: profile.kycDocuments.map((document) => ({
        id: document.id,
        docType: document.docType,
        fileUrl: document.fileUrl,
        expiresAt: this.dateToIsoDate(document.expiresAt),
        verifiedAt: document.verifiedAt?.toISOString() ?? null,
      })),
    };
  }

  private dateToIsoDate(date: Date | null): string | null {
    return date?.toISOString().slice(0, 10) ?? null;
  }

  private async translateProviderProfileErrors<T>(
    action: () => Promise<T>,
  ): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (this.isSiretUniqueConstraintError(error)) {
        throw new ConflictException({
          code: 'SIRET_ALREADY_USED',
          message: 'Ce SIRET est déjà associé à un autre prestataire.',
          details: [],
        });
      }

      throw error;
    }
  }

  private isSiretUniqueConstraintError(error: unknown): boolean {
    if (!error || typeof error !== 'object' || !('code' in error)) {
      return false;
    }

    const prismaError = error as { code?: unknown; meta?: { target?: unknown } };
    if (prismaError.code !== 'P2002') {
      return false;
    }

    const target = prismaError.meta?.target;
    return Array.isArray(target) && target.includes('siret');
  }
}
