import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExpoPushService } from '../expo-push.service';
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
    const expoPush = { send: jest.fn() };
    const service = new NotificationsService(
      prisma as unknown as PrismaService,
      expoPush as unknown as ExpoPushService,
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
      { send: jest.fn() } as unknown as ExpoPushService,
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

describe('NotificationsService.processSendPush', () => {
  it('n’envoie rien sans token enregistré', async () => {
    const prisma = {
      pushToken: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const expoPush = { send: jest.fn() };
    const service = new NotificationsService(
      prisma as unknown as PrismaService,
      expoPush as unknown as ExpoPushService,
    );

    await expect(
      service.processSendPush({
        userId,
        title: 'Mission',
        body: 'Pro trouvé',
      }),
    ).resolves.toEqual({ sent: 0, tickets: [] });
    expect(expoPush.send).not.toHaveBeenCalled();
  });

  it('envoie un push Expo pour chaque token (RG M09-S02)', async () => {
    const prisma = {
      pushToken: {
        findMany: jest.fn().mockResolvedValue([{ token }]),
      },
    };
    const expoPush = {
      send: jest.fn().mockResolvedValue([{ status: 'ok', id: 'ticket-1' }]),
    };
    const service = new NotificationsService(
      prisma as unknown as PrismaService,
      expoPush as unknown as ExpoPushService,
    );

    await expect(
      service.processSendPush({
        userId,
        title: 'En route',
        body: 'Le pro arrive',
        data: { bookingId: '77777777-7777-4777-8777-777777777777' },
      }),
    ).resolves.toMatchObject({ sent: 1 });
    expect(expoPush.send).toHaveBeenCalledWith([
      {
        to: token,
        title: 'En route',
        body: 'Le pro arrive',
        data: { bookingId: '77777777-7777-4777-8777-777777777777' },
        sound: 'default',
      },
    ]);
  });
});
