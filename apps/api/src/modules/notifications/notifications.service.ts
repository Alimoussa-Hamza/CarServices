import { Injectable } from '@nestjs/common';
import type {
  PushPlatform,
  RegisterPushTokenDto,
} from '@carservice/shared-types';
import { AuthPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerPushToken(user: AuthPayload, dto: RegisterPushTokenDto) {
    const saved = await this.prisma.pushToken.upsert({
      where: { token: dto.token },
      create: {
        userId: user.sub,
        token: dto.token,
        platform: dto.platform ?? null,
      },
      update: {
        userId: user.sub,
        platform: dto.platform ?? null,
      },
    });

    return {
      data: {
        id: saved.id,
        token: saved.token,
        platform: (saved.platform as PushPlatform | null) ?? null,
        updatedAt: saved.updatedAt.toISOString(),
      },
    };
  }
}
