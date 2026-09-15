import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NotificationsQueueService } from '../../src/modules/notifications/notifications-queue.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app';
import {
  attachProviderBaseAddresses,
  cleanupUsers,
  configureProviderOps,
  createClientAddress,
  E2E_LYON as LYON,
  Envelope,
  futureSlotIso,
  loadCatalogSeed,
  login,
  providerCompletionPhotos,
  submitAndApproveKyc,
} from './e2e-helpers';

function hasPushType(
  calls: unknown[][],
  type: string,
): boolean {
  return calls.some(
    (call) =>
      (call[0] as { data?: { type?: string } } | undefined)?.data?.type === type,
  );
}

function hasTemplate(
  calls: unknown[][],
  templateId: string,
): boolean {
  return calls.some(
    (call) =>
      (call[0] as { templateId?: string } | undefined)?.templateId ===
      templateId,
  );
}

/**
 * Gate fin de module M09 : push token + triggers RG-NOTIF (nouvelle mission,
 * pro trouvé, en route, terminé) avant M10.
 */
describe('E2E M09 Notifications — gate module', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let notificationsQueue: NotificationsQueueService;
  let http: () => ReturnType<typeof request>;

  const suffix = `${Date.now()}`.slice(-6);
  const phones = {
    client: `+33651${suffix}`,
    provider: `+33652${suffix}`,
  };
  const tokens: Record<string, string> = {};
  const userIds: string[] = [];

  let offerId = '';
  let zoneId = '';
  let clientAddressId = '';

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    notificationsQueue = app.get(NotificationsQueueService);
    http = () => request(app.getHttpServer());

    const catalog = await loadCatalogSeed(prisma);
    offerId = catalog.offerId;
    zoneId = catalog.zoneId;

    tokens.client = await login(http, phones.client, 'client', userIds, prisma);
    tokens.provider = await login(
      http,
      phones.provider,
      'provider',
      userIds,
      prisma,
    );

    await submitAndApproveKyc(
      http,
      prisma,
      tokens.provider,
      phones.provider,
      `51${suffix}000001`,
      ['waterless'],
    );
    await configureProviderOps(http, tokens.provider, offerId, zoneId);
    await attachProviderBaseAddresses(prisma, [phones.provider]);
    clientAddressId = await createClientAddress(prisma, phones.client);
  });

  afterAll(async () => {
    await cleanupUsers(prisma, userIds);
    await app.close();
  });

  it('POST /users/push-token + triggers notif sur cycle mission (RG-NOTIF)', async () => {
    const pushToken = `ExponentPushToken[m09${suffix}xxxxxxxxxxxxxx]`;
    await http()
      .post('/api/v1/users/push-token')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({ token: pushToken, platform: 'ios' })
      .expect(201);

    const enqueuePush = jest.spyOn(notificationsQueue, 'enqueuePush');
    const enqueueTemplate = jest.spyOn(
      notificationsQueue,
      'enqueueBookingTemplate',
    );

    const created = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(5),
      })
      .expect(201);
    const bookingId = (
      created.body as Envelope<{ booking: { id: string } }>
    ).data.booking.id;

    expect(hasPushType(enqueuePush.mock.calls, 'booking.new_mission')).toBe(
      true,
    );
    expect(hasTemplate(enqueueTemplate.mock.calls, 'provider_new_mission')).toBe(
      true,
    );

    await http()
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(201);

    expect(
      hasPushType(enqueuePush.mock.calls, 'booking.provider_assigned'),
    ).toBe(true);
    expect(hasTemplate(enqueueTemplate.mock.calls, 'provider_assigned')).toBe(
      true,
    );

    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'en_route' })
      .expect(200);

    expect(hasPushType(enqueuePush.mock.calls, 'booking.en_route')).toBe(true);

    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'in_progress', lat: LYON.lat, lng: LYON.lng })
      .expect(200);
    await prisma.bookingPhoto.createMany({
      data: providerCompletionPhotos(
        bookingId,
        `https://cdn.example/e2e-m09-${suffix}`,
      ),
    });
    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'completed' })
      .expect(200);

    expect(hasPushType(enqueuePush.mock.calls, 'booking.completed')).toBe(true);
    expect(hasTemplate(enqueueTemplate.mock.calls, 'booking_completed')).toBe(
      true,
    );

    enqueuePush.mockRestore();
    enqueueTemplate.mockRestore();
  });
});
