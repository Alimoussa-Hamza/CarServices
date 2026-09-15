import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app';
import {
  attachProviderBaseAddresses,
  cleanupUsers,
  configureProviderOps,
  createClientAddress,
  E2E_LYON as LYON,
  Envelope,
  ErrorEnvelope,
  futureSlotIso,
  loadCatalogSeed,
  login,
  providerCompletionPhotos,
  submitAndApproveKyc,
} from './e2e-helpers';

/**
 * Gate fin de module M08 : parcours isolé (ne dépend pas de platform-flow).
 * Couvre avis + liste publique + litige + fenêtres 72 h / 48 h avant M09.
 */
describe('E2E M08 Reviews & Disputes — gate module', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  const suffix = `${Date.now()}`.slice(-6);
  const phones = {
    client: `+33641${suffix}`,
    provider: `+33642${suffix}`,
  };
  const tokens: Record<string, string> = {};
  const userIds: string[] = [];

  let offerId = '';
  let zoneId = '';
  let clientAddressId = '';
  let providerId = '';

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

    await submitAndApproveKyc(
      http,
      prisma,
      tokens.provider,
      phones.provider,
      `41${suffix}000001`,
      ['waterless'],
    );
    await configureProviderOps(http, tokens.provider, offerId, zoneId);
    await attachProviderBaseAddresses(prisma, [phones.provider]);
    clientAddressId = await createClientAddress(prisma, phones.client);

    const provider = await prisma.providerProfile.findFirstOrThrow({
      where: {
        user: { phone: phones.provider },
      },
      select: { id: true },
    });
    providerId = provider.id;
  });

  afterAll(async () => {
    await cleanupUsers(prisma, userIds);
    await app.close();
  });

  async function createCompletedBooking(daysAhead: number) {
    const created = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(daysAhead),
      })
      .expect(201);
    const bookingId = (
      created.body as Envelope<{ booking: { id: string } }>
    ).data.booking.id;

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
      .send({ status: 'in_progress', lat: LYON.lat, lng: LYON.lng })
      .expect(200);
    await prisma.bookingPhoto.createMany({
      data: providerCompletionPhotos(
        bookingId,
        `https://cdn.example/e2e-m08-${daysAhead}`,
      ),
    });
    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'completed' })
      .expect(200);

    return bookingId;
  }

  it('POST /reviews + GET public + POST /disputes (happy path)', async () => {
    const bookingId = await createCompletedBooking(7);

    const review = await http()
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        bookingId,
        rating: 5,
        comment: 'Impeccable M08',
        tags: ['quality'],
      })
      .expect(201);
    expect(
      (
        review.body as Envelope<{
          provider: { ratingAvg: number; ratingCount: number };
        }>
      ).data.provider,
    ).toMatchObject({ ratingAvg: 5, ratingCount: 1 });

    const listed = await http()
      .get(`/api/v1/reviews/provider/${providerId}`)
      .expect(200);
    expect(
      (
        listed.body as Envelope<{
          items: Array<{ comment: string | null }>;
          total: number;
        }>
      ).data,
    ).toMatchObject({ total: 1 });
    expect(
      (listed.body as Envelope<{ items: Array<{ comment: string | null }> }>)
        .data.items[0]?.comment,
    ).toBe('Impeccable M08');

    const disputeBookingId = await createCompletedBooking(8);
    const opened = await http()
      .post('/api/v1/disputes')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        bookingId: disputeBookingId,
        reason: 'quality',
        description: 'Prestation incomplète détectée en gate M08.',
      })
      .expect(201);
    expect(
      (
        opened.body as Envelope<{
          bookingStatus: string;
          payoutFrozen: boolean;
        }>
      ).data,
    ).toMatchObject({
      bookingStatus: 'disputed',
      payoutFrozen: true,
    });

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { bookingId: disputeBookingId },
    });
    expect(payment.payoutFrozenAt).not.toBeNull();
  });

  it('refuse avis > 72 h et litige > 48 h', async () => {
    const bookingId = await createCompletedBooking(9);
    const expiredAt = new Date(Date.now() - 73 * 60 * 60 * 1000);
    await prisma.bookingStatusHistory.updateMany({
      where: { bookingId, toStatus: 'completed' },
      data: { createdAt: expiredAt },
    });

    const lateReview = await http()
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({ bookingId, rating: 3, comment: 'Hors délai avis' })
      .expect(409);
    expect((lateReview.body as ErrorEnvelope).error.code).toBe(
      'REVIEW_WINDOW_EXPIRED',
    );

    const lateDispute = await http()
      .post('/api/v1/disputes')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        bookingId,
        reason: 'delay',
        description: 'Hors délai litige après completion.',
      })
      .expect(409);
    expect((lateDispute.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_DISPUTE_WINDOW_EXPIRED',
    );
  });
});
