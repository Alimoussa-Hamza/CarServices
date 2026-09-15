import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BookingMatchingService } from '../../src/modules/bookings/booking-matching.service';
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
  submitAndApproveKyc,
} from './e2e-helpers';

/**
 * Gate fin de module M05 : parcours isolé (ne dépend pas de platform-flow).
 * Couvre le happy path C07→C11 + les erreurs métier P0 avant d’ouvrir M06.
 */
describe('E2E M05 Bookings — gate module', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  const suffix = `${Date.now()}`.slice(-6);
  const phones = {
    client: `+33611${suffix}`,
    providerA: `+33612${suffix}`,
    providerB: `+33613${suffix}`,
    draft: `+33614${suffix}`,
  };
  const tokens: Record<string, string> = {};
  const userIds: string[] = [];

  let zoneId = '';
  let offerId = '';
  let clientAddressId = '';

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    http = () => request(app.getHttpServer());

    const catalog = await loadCatalogSeed(prisma);
    zoneId = catalog.zoneId;
    offerId = catalog.offerId;

    tokens.client = await login(http, phones.client, 'client', userIds, prisma);
    tokens.providerA = await login(
      http,
      phones.providerA,
      'provider',
      userIds,
      prisma,
    );
    tokens.providerB = await login(
      http,
      phones.providerB,
      'provider',
      userIds,
      prisma,
    );
    tokens.draft = await login(http, phones.draft, 'provider', userIds, prisma);

    await submitAndApproveKyc(
      http,
      prisma,
      tokens.providerA,
      phones.providerA,
      `20${suffix}000001`,
      ['waterless'],
    );
    await submitAndApproveKyc(
      http,
      prisma,
      tokens.providerB,
      phones.providerB,
      `20${suffix}000002`,
      ['steam'],
    );
    await configureProviderOps(http, tokens.providerA, offerId, zoneId);
    await configureProviderOps(http, tokens.providerB, offerId, zoneId);
    await attachProviderBaseAddresses(prisma, [
      phones.providerA,
      phones.providerB,
    ]);
    clientAddressId = await createClientAddress(prisma, phones.client);
  });

  afterAll(async () => {
    await cleanupUsers(prisma, userIds);
    await app.close();
  });

  it('parcours complet : slots → create → accept → complete + timeline', async () => {
    const slots = await http()
      .post('/api/v1/bookings/slots')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
      })
      .expect(200);
    const grid = (
      slots.body as Envelope<{
        horizonDays: number;
        days: Array<{ date: string; slots: Array<{ start: string; available: boolean }> }>;
      }>
    ).data;
    expect(grid.horizonDays).toBe(14);
    expect(grid.days).toHaveLength(15);

    const slotStart = futureSlotIso();
    const day = grid.days.find((row) => row.date === slotStart.slice(0, 10));
    expect(
      day?.slots.some((slot) => slot.start === slotStart && slot.available),
    ).toBe(true);

    const created = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart,
        clientComment: 'Gate M05',
      })
      .expect(201);
    const booking = (
      created.body as Envelope<{
        booking: { id: string; reference: string; status: string };
        matching: { broadcastCount: number };
        payment: { paymentIntentId: string };
      }>
    ).data;
    expect(booking.booking.status).toBe('pending_provider');
    expect(booking.booking.reference).toMatch(/^CS-\d{8}-[A-Z0-9]{4}$/);
    expect(booking.matching.broadcastCount).toBeGreaterThanOrEqual(2);
    expect(booking.payment.paymentIntentId).toMatch(/^pi_mock_/);
    const bookingId = booking.booking.id;
    const storedPayment = await prisma.payment.findUniqueOrThrow({
      where: { bookingId },
    });
    expect(storedPayment.status).toBe('authorized');
    expect(storedPayment.stripePaymentIntentId).toBe(
      booking.payment.paymentIntentId,
    );
    expect(storedPayment.commissionCents + storedPayment.providerNetCents).toBe(
      storedPayment.amountCents,
    );

    const pendingDetail = await http()
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .expect(200);
    expect(
      (pendingDetail.body as Envelope<{ addressSnapshot: unknown }>).data
        .addressSnapshot,
    ).toBeNull();

    const available = await http()
      .get('/api/v1/bookings/available')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(200);
    expect(
      (available.body as Envelope<Array<{ id: string }>>).data.some(
        (row) => row.id === bookingId,
      ),
    ).toBe(true);

    const accepted = await http()
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(201);
    expect(
      (
        accepted.body as Envelope<{
          status: string;
          addressSnapshot: { street: string };
        }>
      ).data,
    ).toMatchObject({
      status: 'accepted',
      addressSnapshot: { street: expect.stringContaining('République') },
    });

    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'en_route' })
      .expect(200);
    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({
        status: 'in_progress',
        lat: 45.764,
        lng: 4.8357,
      })
      .expect(200);

    await prisma.bookingPhoto.createMany({
      data: [
        {
          bookingId,
          uploadedBy: 'provider',
          photoType: 'before',
          fileUrl: 'https://cdn.carservice.test/m05-before.jpg',
        },
        {
          bookingId,
          uploadedBy: 'provider',
          photoType: 'after',
          fileUrl: 'https://cdn.carservice.test/m05-after.jpg',
        },
      ],
    });
    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'completed' })
      .expect(200);

    const capturedPayment = await prisma.payment.findUniqueOrThrow({
      where: { bookingId },
    });
    expect(capturedPayment.status).toBe('captured');
    expect(capturedPayment.capturedAt).not.toBeNull();
    expect(
      capturedPayment.commissionCents + capturedPayment.providerNetCents,
    ).toBe(capturedPayment.amountCents);

    const detail = await http()
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(200);
    const payload = (
      detail.body as Envelope<{
        status: string;
        timeline: Array<{ toStatus: string }>;
      }>
    ).data;
    expect(payload.status).toBe('completed');
    expect(payload.timeline.map((row) => row.toStatus)).toEqual(
      expect.arrayContaining([
        'pending_provider',
        'accepted',
        'en_route',
        'in_progress',
        'completed',
      ]),
    );

    const past = await http()
      .get('/api/v1/bookings?group=past')
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(200);
    expect(
      (past.body as Envelope<Array<{ id: string }>>).data.some(
        (row) => row.id === bookingId,
      ),
    ).toBe(true);
  });

  it('refuse les cas métier P0 (slot, KYC, graphe, géofence, photos, cancel, T2)', async () => {
    const kyc = await http()
      .get('/api/v1/bookings/available')
      .set('Authorization', `Bearer ${tokens.draft}`)
      .expect(403);
    expect((kyc.body as ErrorEnvelope).error.code).toBe('KYC_NOT_APPROVED');

    const soon = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .expect(409);
    expect((soon.body as ErrorEnvelope).error.code).toBe('SLOT_UNAVAILABLE');

    const created = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(8),
      })
      .expect(201);
    const bookingId = (
      created.body as Envelope<{ booking: { id: string } }>
    ).data.booking.id;

    await http()
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(201);

    const skip = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'completed' })
      .expect(409);
    expect((skip.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_INVALID_TRANSITION',
    );

    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'en_route' })
      .expect(200);

    const far = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'in_progress', lat: 48.8566, lng: 2.3522 })
      .expect(400);
    expect((far.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_GEOFENCE_FAILED',
    );

    await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'in_progress' })
      .expect(200);

    const noPhotos = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'completed' })
      .expect(400);
    expect((noPhotos.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_PHOTOS_REQUIRED',
    );

    const viaDispute = await http()
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({})
      .expect(409);
    expect((viaDispute.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_CANCEL_VIA_DISPUTE',
    );

    const timeoutCreated = await http()
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
    const timeoutId = (
      timeoutCreated.body as Envelope<{ booking: { id: string } }>
    ).data.booking.id;
    const matching = app.get(BookingMatchingService);
    await matching.timeoutUnassigned(timeoutId);
    const acceptDead = await http()
      .post(`/api/v1/bookings/${timeoutId}/accept`)
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .expect(409);
    expect((acceptDead.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_ALREADY_ACCEPTED',
    );
  });
});
