import { UserRole } from '@prisma/client';
import { SmsService } from '../../auth/sms.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../email.service';
import { ExpoPushService } from '../expo-push.service';
import { NotificationsService } from '../notifications.service';

const userId = '11111111-1111-4111-8111-111111111111';
const token = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
const now = new Date('2026-09-15T22:00:00.000Z');

function buildService(overrides?: {
  prisma?: object;
  expoPush?: object;
  email?: object;
  sms?: object;
}) {
  const prisma = {
    pushToken: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    ...overrides?.prisma,
  };
  const expoPush = { send: jest.fn(), ...overrides?.expoPush };
  const email = { send: jest.fn(), ...overrides?.email };
  const sms = { send: jest.fn(), ...overrides?.sms };

  return {
    service: new NotificationsService(
      prisma as unknown as PrismaService,
      expoPush as unknown as ExpoPushService,
      email as unknown as EmailService,
      sms as unknown as SmsService,
    ),
    prisma,
    expoPush,
    email,
    sms,
  };
}

describe('NotificationsService.registerPushToken', () => {
  it('crée un token Expo pour l’utilisateur', async () => {
    const { service, prisma } = buildService({
      prisma: {
        pushToken: {
          upsert: jest.fn().mockResolvedValue({
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            token,
            platform: 'ios',
            updatedAt: now,
          }),
          findMany: jest.fn(),
        },
      },
    });

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
});

describe('NotificationsService.processSendPush', () => {
  it('n’envoie rien sans token enregistré', async () => {
    const { service, expoPush } = buildService();

    await expect(
      service.processSendPush({
        userId,
        title: 'Mission',
        body: 'Pro trouvé',
      }),
    ).resolves.toEqual({ sent: 0, tickets: [] });
    expect(expoPush.send).not.toHaveBeenCalled();
  });

  it('envoie un push Expo pour chaque token', async () => {
    const { service, expoPush } = buildService({
      prisma: {
        pushToken: {
          upsert: jest.fn(),
          findMany: jest.fn().mockResolvedValue([{ token }]),
        },
      },
      expoPush: {
        send: jest.fn().mockResolvedValue([{ status: 'ok', id: 'ticket-1' }]),
      },
    });

    await expect(
      service.processSendPush({
        userId,
        title: 'En route',
        body: 'Le pro arrive',
        data: { bookingId: '77777777-7777-4777-8777-777777777777' },
      }),
    ).resolves.toMatchObject({ sent: 1 });
    expect(expoPush.send).toHaveBeenCalled();
  });
});

describe('NotificationsService SMS / email / templates', () => {
  it('délègue processSendSms à SmsService', async () => {
    const { service, sms } = buildService();
    await expect(
      service.processSendSms({
        phone: '+33600000001',
        body: 'CARSERVICE — test',
      }),
    ).resolves.toEqual({ sent: 1 });
    expect(sms.send).toHaveBeenCalledWith('+33600000001', 'CARSERVICE — test');
  });

  it('délègue processSendEmail à EmailService', async () => {
    const { service, email } = buildService({
      email: {
        send: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
      },
    });
    await expect(
      service.processSendEmail({
        to: 'client@example.com',
        subject: 'OK',
        html: '<p>OK</p>',
        text: 'OK',
      }),
    ).resolves.toEqual({ sent: 1, messageId: 'msg-1' });
  });

  it('rend provider_assigned sur email + sms', () => {
    const { service } = buildService();
    const rendered = service.buildBookingNotification('provider_assigned', {
      reference: 'CS-20260915-ABCD',
    });
    expect(rendered.channels).toEqual(['email', 'sms']);
    expect(rendered.email?.subject).toContain('CS-20260915-ABCD');
    expect(rendered.sms).toContain('CS-20260915-ABCD');
  });
});
