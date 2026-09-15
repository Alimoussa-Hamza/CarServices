import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import {
  AdminListUsersQuery,
  AdminUpdateUserDto,
  AdminUserListItem,
  AdminUsersListResponse,
} from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: AdminListUsersQuery,
  ): Promise<{ data: AdminUsersListResponse }> {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          clientProfile: { select: { firstName: true, lastName: true } },
          providerProfile: { select: { companyName: true, kycStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
    ]);

    return {
      data: {
        items: rows.map((row) => this.toListItem(row)),
        total,
        page: query.page,
        pageSize: query.pageSize,
      },
    };
  }

  async update(
    userId: string,
    dto: AdminUpdateUserDto,
    actorId: string,
  ): Promise<{ data: AdminUserListItem }> {
    if (userId === actorId && dto.isActive === false) {
      throw new ForbiddenException({
        code: 'CANNOT_DISABLE_SELF',
        message: 'Un admin ne peut pas se désactiver lui-même.',
        details: [],
      });
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        clientProfile: { select: { firstName: true, lastName: true } },
        providerProfile: { select: { companyName: true, kycStatus: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Utilisateur introuvable.',
        details: [],
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isActive === false) {
        await tx.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return tx.user.update({
        where: { id: userId },
        data: { isActive: dto.isActive },
        include: {
          clientProfile: { select: { firstName: true, lastName: true } },
          providerProfile: { select: { companyName: true, kycStatus: true } },
        },
      });
    });

    return { data: this.toListItem(updated) };
  }

  private buildWhere(query: AdminListUsersQuery): Prisma.UserWhereInput {
    const roleFilter: Prisma.UserWhereInput = query.role
      ? { role: query.role as UserRole }
      : {};

    if (!query.q) {
      return roleFilter;
    }

    const term = query.q;
    return {
      AND: [
        roleFilter,
        {
          OR: [
            { phone: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
      ],
    };
  }

  private toListItem(row: {
    id: string;
    phone: string;
    email: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    clientProfile: { firstName: string | null; lastName: string | null } | null;
    providerProfile: { companyName: string | null; kycStatus: string } | null;
  }): AdminUserListItem {
    return {
      id: row.id,
      phone: row.phone,
      email: row.email,
      role: row.role,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      clientProfile: row.clientProfile
        ? {
            firstName: row.clientProfile.firstName,
            lastName: row.clientProfile.lastName,
          }
        : null,
      providerProfile: row.providerProfile
        ? {
            companyName: row.providerProfile.companyName,
            kycStatus: row.providerProfile.kycStatus,
          }
        : null,
    };
  }
}
