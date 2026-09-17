import { INestApplication } from '@nestjs/common';
import {
  BOOKING_MIN_AFTER_PHOTOS,
  BOOKING_MIN_BEFORE_PHOTOS,
} from '@carservice/shared-types';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app';
import {
  attachProviderBaseAddresses,
  cleanupUsers,
  configureProviderOps,
  createClientAddress,
  Envelope,
  ErrorEnvelope,
  futureSlotIso,
  loadCatalogSeed,
  login,
  loginAdmin,
  submitAndApproveKyc,
} from './e2e-helpers';

/**
 * Gate fin de module M12 : golden path client pré-auth → pro accept →
 * photos 2+2 → completed + capture 20 % → booking visible admin.
 */
describe('E2E M12 Mobile pro — gate module', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  const suffix = `${Date.now()}`.slice(-6);
  const phones = {
    client: `+33641${suffix}`,
    provider: `+33642${suffix}`,
    admin: `+33643${suffix}`,
  };
  const tokens: Record<string, string> = {};
  const userIds: string[] = [];

  let offerId = '';
  let zoneId = '';
  let clientAddressId = '';

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
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
    tokens.admin = await loginAdmin(http, phones.admin, userIds, prisma);

    await submitAndApproveKyc(
      http,
      prisma,
      tokens.provider,
      phones.provider,
      `42${suffix}000001`,
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

  async function confirmBookingPhoto(
    bookingId: string,
    photoType: 'before' | 'after',
  ) {
    const uploaded = await http()
      .post('/api/v1/media/upload-url')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({
        mimeType: 'image/jpeg',
        context: 'booking_photo',
        bookingId,
        photoType,
      })
      .expect(200);
    const fileKey = (uploaded.body as Envelope<{ fileKey: string }>).data
      .fileKey;
    await http()
      .post('/api/v1/media/confirm')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ fileKey })
      .expect(200);
  }

  it('golden path : pré-auth client → accept pro → 2+2 → captured 20 % → admin', async () => {
    const created = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(9),
      })
      .expect(201);
    const bookingId = (
      created.body as Envelope<{ booking: { id: string } }>
    ).data.booking.id;
    const authorized = await prisma.payment.findUniqueOrThrow({
      where: { bookingId },
    });
    expect(authorized.status).toBe('authorized');
    expect(authorized.commissionCents).toBe(
      Math.round(authorized.amountCents * 0.2),
    );

    await http()
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(201);
    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'en_route' })
      .expect(200);
    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'in_progress', lat: 45.764, lng: 4.8357 })
      .expect(200);

    for (let i = 0; i < BOOKING_MIN_BEFORE_PHOTOS; i += 1) {
      await confirmBookingPhoto(bookingId, 'before');
    }
    for (let i = 0; i < BOOKING_MIN_AFTER_PHOTOS; i += 1) {
      await confirmBookingPhoto(bookingId, 'after');
    }

    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'completed' })
      .expect(200);

    const stored = await prisma.payment.findUniqueOrThrow({
      where: { bookingId },
    });
    expect(stored.status).toBe('captured');
    expect(stored.commissionCents + stored.providerNetCents).toBe(
      stored.amountCents,
    );

    const adminDetail = await http()
      .get(`/api/v1/admin/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);
    expect(
      (
        adminDetail.body as Envelope<{
          status: string;
          payment: { status: string } | null;
        }>
      ).data,
    ).toMatchObject({
      status: 'completed',
      payment: { status: 'captured' },
    });
  });

  it('P0 : completed sans 2+2 → BOOKING_PHOTOS_REQUIRED', async () => {
    const created = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'berline',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(10),
      })
      .expect(201);
    const bookingId = (created.body as Envelope<{ booking: { id: string } }>)
      .data.booking.id;
    await http()
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(201);
    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'en_route' })
      .expect(200);
    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'in_progress', lat: 45.764, lng: 4.8357 })
      .expect(200);
    const denied = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'completed' })
      .expect(400);
    expect((denied.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_PHOTOS_REQUIRED',
    );
  });
});
