import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../notifications.service';

const userId = '11111111-1111-4111-8111-111111111111';
const token = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
const now = new Date('2026-09-15T22:00:00.000Z');

describe('NotificationsService.registerPushToken', () => {
  it('crée un token Expo pour l’utilisateur', async () => {
    const prisma = {
      pushToken: {
        upsert: jest.fn().mockResolvedValue({
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          token,
          platform: 'ios',
          updatedAt: now,
        }),
      },
    };
    const service = new NotificationsService(
      prisma as unknown as PrismaService,
    );

    await expect(
      service.registerPushToken(
        { sub: userId, role: UserRole.client },
        { token, platform: 'ios' },
      ),
    ).resolves.toMatchObject({
      data: {
        token,
        platform: 'ios',
        updatedAt: now.toISOString(),
      },
    });
    expect(prisma.pushToken.upsert).toHaveBeenCalledWith({
      where: { token },
      create: { userId, token, platform: 'ios' },
      update: { userId, platform: 'ios' },
    });
  });

  it('réassigne un token existant à l’utilisateur courant', async () => {
    const prisma = {
      pushToken: {
        upsert: jest.fn().mockResolvedValue({
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          token,
          platform: null,
          updatedAt: now,
        }),
      },
    };
    const service = new NotificationsService(
      prisma as unknown as PrismaService,
    );

    await service.registerPushToken(
      { sub: userId, role: UserRole.provider },
      { token },
    );

    expect(prisma.pushToken.upsert).toHaveBeenCalledWith({
      where: { token },
      create: { userId, token, platform: null },
      update: { userId, platform: null },
    });
  });
});
