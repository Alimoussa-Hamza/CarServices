import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ClientProfile,
  DeletedClientAccount,
  UpdateClientProfileDto,
} from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<{ data: ClientProfile }> {
    const profile = await this.loadProfile(userId);
    return { data: profile };
  }

  async updateMe(
    userId: string,
    dto: UpdateClientProfileDto,
  ): Promise<{ data: ClientProfile }> {
    await this.loadProfile(userId);
    await this.prisma.clientProfile.update({
      where: { userId },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      },
    });
    return { data: await this.loadProfile(userId) };
  }

  async deleteMe(
    userId: string,
    now = new Date(),
  ): Promise<{ data: DeletedClientAccount }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { clientProfile: true },
    });
    if (!user || user.role !== UserRole.client || !user.clientProfile) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Seuls les comptes client peuvent être supprimés ici.',
        details: [],
      });
    }
    if (!user.isActive) {
      throw new NotFoundException({
        code: 'ACCOUNT_ALREADY_DELETED',
        message: 'Ce compte est déjà désactivé.',
        details: [],
      });
    }

    const anonPhone = `del_${userId.replace(/-/g, '').slice(0, 12)}`;
    const anonEmail = `deleted_${userId.replace(/-/g, '').slice(0, 12)}@invalid.local`;

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.pushToken.deleteMany({ where: { userId } });
      await tx.address.updateMany({
        where: { userId },
        data: { userId: null },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          phone: anonPhone,
          email: anonEmail,
          passwordHash: null,
        },
      });
    });

    return {
      data: {
        userId,
        deleted: true,
        anonymizedAt: now.toISOString(),
      },
    };
  }

  private async loadProfile(userId: string): Promise<ClientProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { clientProfile: true },
    });
    if (!user || !user.isActive || user.role !== UserRole.client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        message: 'Profil client introuvable.',
        details: [],
      });
    }
    if (!user.clientProfile) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        message: 'Profil client introuvable.',
        details: [],
      });
    }

    return {
      id: user.clientProfile.id,
      userId: user.id,
      firstName: user.clientProfile.firstName,
      lastName: user.clientProfile.lastName,
      phone: user.phone,
      email: user.email,
      createdAt: user.clientProfile.createdAt.toISOString(),
      updatedAt: user.clientProfile.updatedAt.toISOString(),
    };
  }
}
