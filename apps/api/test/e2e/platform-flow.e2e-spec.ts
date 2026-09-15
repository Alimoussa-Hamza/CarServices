import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BookingMatchingService } from '../../src/modules/bookings/booking-matching.service';
import {
  MATCHING_JOB_EXPAND,
  MATCHING_JOB_UNASSIGNED,
  MatchingQueueService,
  matchingJobId,
} from '../../src/modules/bookings/matching-queue.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app';
import {
  attachProviderBaseAddresses,
  cleanupUsers,
  createClientAddress,
  E2E_LYON as LYON,
  Envelope,
  ErrorEnvelope,
  futureSlotIso,
  loadCatalogSeed,
  login,
  loginAdmin,
} from './e2e-helpers';

describe('E2E plateforme (DB réelle, OTP/SMS/Stripe mock)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  const suffix = `${Date.now()}`.slice(-6);
  const phones = {
    client: `+33601${suffix}`,
    providerA: `+33602${suffix}`,
    providerB: `+33603${suffix}`,
    draft: `+33604${suffix}`,
  };

  const tokens: Record<string, string> = {};
  const userIds: string[] = [];

  let zoneId = '';
  let offerId = '';
  let optionId = '';
  let clientAddressId = '';
  let bookingId = '';
  let bookingReference = '';

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    http = () => request(app.getHttpServer());

    const catalog = await loadCatalogSeed(prisma);
    zoneId = catalog.zoneId;
    offerId = catalog.offerId;
    optionId = catalog.optionId;
  });

  afterAll(async () => {
    await cleanupUsers(prisma, userIds);
    await app.close();
  });

  it('CS-M00 health + ready (Postgres)', async () => {
    const health = await http().get('/api/v1/health').expect(200);
    expect((health.body as Envelope<{ status: string }>).data.status).toBe('ok');

    const ready = await http().get('/api/v1/health/ready').expect(200);
    expect(
      (ready.body as Envelope<{ checks: { database: string } }>).data.checks
        .database,
    ).toBe('ok');
  });

  it('CS-M03 catalogue + zone PostGIS', async () => {
    const categories = await http().get('/api/v1/catalog/categories').expect(200);
    expect(
      (categories.body as Envelope<Array<{ slug: string }>>).data.some(
        (category) => category.slug === 'wash',
      ),
    ).toBe(true);

    const quote = await http()
      .post('/api/v1/catalog/quote')
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: optionId ? [optionId] : [],
        zoneSlug: 'lyon',
      })
      .expect(200);

    const breakdown = (
      quote.body as Envelope<{
        breakdown: { totalCents: number; currency: string };
        durationMinutes: number;
      }>
    ).data;
    expect(breakdown.breakdown.currency).toBe('EUR');
    expect(breakdown.breakdown.totalCents).toBeGreaterThan(8500);
    expect(breakdown.durationMinutes).toBeGreaterThanOrEqual(90);

    const covered = await http()
      .post('/api/v1/zones/check')
      .send({ lat: LYON.lat, lng: LYON.lng })
      .expect(200);
    expect(
      (covered.body as Envelope<{ covered: boolean; zone?: { slug: string } }>)
        .data,
    ).toMatchObject({ covered: true, zone: { slug: 'lyon' } });
  });

  it('CS-M02 auth OTP mock → JWT client + providers', async () => {
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

    const me = await http()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(200);
    expect((me.body as Envelope<{ role: string }>).data.role).toBe('client');
  });

  it('CS-M04-S07 brouillon KYC bloqué pour les missions', async () => {
    const res = await http()
      .get('/api/v1/providers/missions/eligibility')
      .set('Authorization', `Bearer ${tokens.draft}`)
      .expect(403);
    expect((res.body as ErrorEnvelope).error.code).toBe('KYC_NOT_APPROVED');
  });

  it('CS-M04 KYC submit + alerte RC Pro + approve mock admin', async () => {
    const submit = await http()
      .post('/api/v1/providers/kyc/submit')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({
        siret: `10${suffix}000001`,
        washMethods: ['waterless'],
        documents: [
          {
            docType: 'rc_pro',
            fileUrl: 'https://cdn.carservice.test/rc-a.pdf',
            expiresAt: '2027-12-31',
          },
        ],
      })
      .expect(201);

    expect(
      (submit.body as Envelope<{ status: string; rcProAlert: unknown }>).data
        .status,
    ).toBe('submitted');
    expect(
      (submit.body as Envelope<{ rcProAlert: null }>).data.rcProAlert,
    ).toBeNull();

    await http()
      .post('/api/v1/providers/kyc/submit')
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .send({
        siret: `10${suffix}000002`,
        washMethods: ['steam'],
        documents: [
          {
            docType: 'rc_pro',
            fileUrl: 'https://cdn.carservice.test/rc-b.pdf',
            expiresAt: '2027-06-15',
          },
        ],
      })
      .expect(201);

    await prisma.providerProfile.updateMany({
      where: { user: { phone: { in: [phones.providerA, phones.providerB] } } },
      data: { kycStatus: 'approved', chargesEnabled: true },
    });

    const eligibility = await http()
      .get('/api/v1/providers/missions/eligibility')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(200);
    expect(
      (eligibility.body as Envelope<{ eligible: boolean; kycStatus: string }>)
        .data,
    ).toEqual({ eligible: true, kycStatus: 'approved' });

    const alerts = await http()
      .get('/api/v1/providers/kyc/alerts')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(200);
    expect((alerts.body as Envelope<{ alert: null }>).data.alert).toBeNull();
  });

  it('CS-M04 capabilities + dispo + zones + Stripe mock', async () => {
    await http()
      .put('/api/v1/providers/capabilities')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ offerIds: [offerId] })
      .expect(200);

    await http()
      .put('/api/v1/providers/capabilities')
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .send({ offerIds: [offerId] })
      .expect(200);

    const weeklySlots = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      startTime: '08:00',
      endTime: '20:00',
      isActive: true,
    }));

    await http()
      .put('/api/v1/providers/availability')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ weeklySlots, blockedSlots: [] })
      .expect(200);

    await http()
      .put('/api/v1/providers/availability')
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .send({ weeklySlots, blockedSlots: [] })
      .expect(200);

    await http()
      .put('/api/v1/providers/zones')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ zones: [{ zoneId, radiusKm: 25 }] })
      .expect(200);

    await http()
      .put('/api/v1/providers/zones')
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .send({ zones: [{ zoneId, radiusKm: 25 }] })
      .expect(200);

    const stripe = await http()
      .post('/api/v1/providers/stripe/onboard')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({
        returnUrl: 'https://pro.carservice.test/stripe/return',
        refreshUrl: 'https://pro.carservice.test/stripe/refresh',
      })
      .expect(201);

    expect(
      (stripe.body as Envelope<{ stripeAccountId: string; url: string }>).data
        .stripeAccountId,
    ).toMatch(/^acct_/);
  });

  it('CS-M05-S01/S03 crée une adresse cliente puis POST /bookings + snapshots', async () => {
    clientAddressId = await createClientAddress(prisma, phones.client);

    await attachProviderBaseAddresses(prisma, [
      phones.providerA,
      phones.providerB,
    ]);

    const slotStart = futureSlotIso();
    const created = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: optionId ? [optionId] : [],
        addressId: clientAddressId,
        slotStart,
        clientComment: 'Parking E2E',
        clientPhotoIds: [],
      })
      .expect(201);

    const payload = (
      created.body as Envelope<{
        booking: {
          id: string;
          reference: string;
          status: string;
          pricingSnapshot: { totalCents: number; currency: string };
        };
        payment: { paymentIntentId: string };
        matching: { broadcastCount: number };
      }>
    ).data;

    bookingId = payload.booking.id;
    bookingReference = payload.booking.reference;

    expect(bookingReference).toMatch(/^CS-\d{8}-[A-Z0-9]{4}$/);
    expect(payload.booking.pricingSnapshot.currency).toBe('EUR');
    expect(payload.payment.paymentIntentId).toMatch(/^pi_mock_/);
    expect(payload.matching.broadcastCount).toBeGreaterThanOrEqual(2);
    expect(payload.booking.status).toBe('pending_provider');

    const persisted = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { items: true, history: true, broadcasts: true, payment: true },
    });
    expect(persisted.items).toHaveLength(1);
    expect(persisted.history.map((row) => row.toStatus)).toEqual(
      expect.arrayContaining(['draft', 'payment_authorized', 'pending_provider']),
    );
    expect(persisted.broadcasts.length).toBeGreaterThanOrEqual(2);
    expect(persisted.payment).toMatchObject({
      stripePaymentIntentId: payload.payment.paymentIntentId,
      status: 'authorized',
    });
    expect(
      (persisted.payment?.commissionCents ?? 0) +
        (persisted.payment?.providerNetCents ?? 0),
    ).toBe(persisted.payment?.amountCents);
  });

  it('CS-M05-S03 refuse adresse inconnue et créneau trop tôt', async () => {
    const unknown = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: '00000000-0000-4000-8000-000000000000',
        slotStart: futureSlotIso(),
      })
      .expect(404);
    expect((unknown.body as ErrorEnvelope).error.code).toBe('ADDRESS_NOT_FOUND');

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
  });

  it('CS-M05-S04 GET /bookings/available pour les deux pros', async () => {
    const availableA = await http()
      .get('/api/v1/bookings/available')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(200);
    const listA = (availableA.body as Envelope<Array<{ id: string }>>).data;
    expect(listA.some((row) => row.id === bookingId)).toBe(true);

    const availableB = await http()
      .get('/api/v1/bookings/available')
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .expect(200);
    expect(
      (availableB.body as Envelope<Array<{ id: string }>>).data.some(
        (row) => row.id === bookingId,
      ),
    ).toBe(true);

    const draftAvailable = await http()
      .get('/api/v1/bookings/available')
      .set('Authorization', `Bearer ${tokens.draft}`)
      .expect(403);
    expect((draftAvailable.body as ErrorEnvelope).error.code).toBe(
      'KYC_NOT_APPROVED',
    );
  });

  it('CS-M05-S05 decline B puis accept A (RG-MATCH-03 + RG-SEC-02)', async () => {
    const declined = await http()
      .post(`/api/v1/bookings/${bookingId}/decline`)
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .send({ reason: 'Créneau E2E trop tôt' })
      .expect(201);

    expect(
      (declined.body as Envelope<{ declined: boolean; remainingBroadcasts: number }>)
        .data.declined,
    ).toBe(true);

    const afterDecline = await http()
      .get('/api/v1/bookings/available')
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .expect(200);
    expect(
      (afterDecline.body as Envelope<Array<{ id: string }>>).data.some(
        (row) => row.id === bookingId,
      ),
    ).toBe(false);

    const accepted = await http()
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(201);

    const mission = (
      accepted.body as Envelope<{
        status: string;
        addressSnapshot: { street: string };
        reference: string;
      }>
    ).data;
    expect(mission.status).toBe('accepted');
    expect(mission.reference).toBe(bookingReference);
    expect(mission.addressSnapshot.street).toContain('République');

    const second = await http()
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .expect(409);
    expect((second.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_ALREADY_ACCEPTED',
    );

    const persisted = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });
    expect(persisted.status).toBe('accepted');
    expect(persisted.providerId).toBeTruthy();
  });

  it('CS-M05-S06 transitions en_route → in_progress → completed', async () => {
    const skip = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'completed' })
      .expect(409);
    expect((skip.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_INVALID_TRANSITION',
    );

    const otherPro = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .send({ status: 'en_route' })
      .expect(403);
    expect((otherPro.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_NOT_ASSIGNED',
    );

    const enRoute = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'en_route', providerNotes: 'En route E2E' })
      .expect(200);
    expect(
      (enRoute.body as Envelope<{ status: string; providerNotes: string }>)
        .data,
    ).toMatchObject({ status: 'en_route', providerNotes: 'En route E2E' });

    const far = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'in_progress', lat: 48.8566, lng: 2.3522 })
      .expect(400);
    expect((far.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_GEOFENCE_FAILED',
    );

    const started = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'in_progress' })
      .expect(200);
    expect((started.body as Envelope<{ status: string }>).data.status).toBe(
      'in_progress',
    );

    const noPhotos = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'completed' })
      .expect(400);
    expect((noPhotos.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_PHOTOS_REQUIRED',
    );

    await prisma.bookingPhoto.createMany({
      data: [
        {
          bookingId,
          uploadedBy: 'provider',
          photoType: 'before',
          fileUrl: 'https://cdn.example/e2e-before.jpg',
        },
        {
          bookingId,
          uploadedBy: 'provider',
          photoType: 'after',
          fileUrl: 'https://cdn.example/e2e-after.jpg',
        },
      ],
    });

    const completed = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'completed' })
      .expect(200);
    expect((completed.body as Envelope<{ status: string }>).data.status).toBe(
      'completed',
    );

    const persisted = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { history: { orderBy: { createdAt: 'asc' } }, payment: true },
    });
    expect(persisted.status).toBe('completed');
    expect(persisted.history.map((row) => row.toStatus)).toEqual(
      expect.arrayContaining(['en_route', 'in_progress', 'completed']),
    );
    expect(persisted.payment).toMatchObject({
      status: 'captured',
    });
    expect(persisted.payment?.capturedAt).not.toBeNull();
    expect(
      (persisted.payment?.commissionCents ?? 0) +
        (persisted.payment?.providerNetCents ?? 0),
    ).toBe(persisted.payment?.amountCents);
  });

  it('CS-M05-S07 jobs T1/T2 → expand puis unassigned (RG-MATCH-04/05)', async () => {
    const created = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(),
      })
      .expect(201);

    const timeoutBookingId = (
      created.body as Envelope<{ booking: { id: string; status: string } }>
    ).data.booking.id;
    expect(
      (created.body as Envelope<{ booking: { status: string } }>).data.booking
        .status,
    ).toBe('pending_provider');

    const matchingQueue = app.get(MatchingQueueService);
    await expect(
      matchingQueue.getJob(matchingJobId(MATCHING_JOB_EXPAND, timeoutBookingId)),
    ).resolves.toBeTruthy();
    await expect(
      matchingQueue.getJob(
        matchingJobId(MATCHING_JOB_UNASSIGNED, timeoutBookingId),
      ),
    ).resolves.toBeTruthy();

    const matching = app.get(BookingMatchingService);
    const expanded = await matching.expandRadius(timeoutBookingId);
    expect(expanded.skipped).toBe(false);

    const timedOut = await matching.timeoutUnassigned(timeoutBookingId);
    expect(timedOut).toEqual({ skipped: false, status: 'unassigned' });

    const persisted = await prisma.booking.findUniqueOrThrow({
      where: { id: timeoutBookingId },
    });
    expect(persisted.status).toBe('unassigned');

    const accept = await http()
      .post(`/api/v1/bookings/${timeoutBookingId}/accept`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(409);
    expect((accept.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_ALREADY_ACCEPTED',
    );
  });

  it('CS-M05-S08 annulation client/pro (RG-CANCEL)', async () => {
    const created = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(),
      })
      .expect(201);
    const freeId = (
      created.body as Envelope<{ booking: { id: string } }>
    ).data.booking.id;

    const cancelled = await http()
      .patch(`/api/v1/bookings/${freeId}/cancel`)
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({})
      .expect(200);
    expect(
      (
        cancelled.body as Envelope<{
          status: string;
          window: string;
          feeCents: number;
        }>
      ).data,
    ).toMatchObject({
      status: 'cancelled_by_client',
      window: 'free',
      feeCents: 0,
    });
    const freePayment = await prisma.payment.findUniqueOrThrow({
      where: { bookingId: freeId },
    });
    expect(freePayment.status).toBe('refunded');

    const assigned = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(),
      })
      .expect(201);
    const assignedId = (
      assigned.body as Envelope<{ booking: { id: string } }>
    ).data.booking.id;
    await http()
      .post(`/api/v1/bookings/${assignedId}/accept`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(201);

    const noReason = await http()
      .patch(`/api/v1/bookings/${assignedId}/cancel`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({})
      .expect(400);
    expect((noReason.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_CANCEL_REASON_REQUIRED',
    );

    const byPro = await http()
      .patch(`/api/v1/bookings/${assignedId}/cancel`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ reason: 'Empêchement E2E' })
      .expect(200);
    expect(
      (byPro.body as Envelope<{ status: string; providerPenalty: number }>)
        .data,
    ).toMatchObject({
      status: 'cancelled_by_provider',
      providerPenalty: 0,
    });

    const inProgress = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(),
      })
      .expect(201);
    const progressId = (
      inProgress.body as Envelope<{ booking: { id: string } }>
    ).data.booking.id;
    await http()
      .post(`/api/v1/bookings/${progressId}/accept`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(201);
    await http()
      .patch(`/api/v1/bookings/${progressId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'en_route' })
      .expect(200);
    await http()
      .patch(`/api/v1/bookings/${progressId}/status`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ status: 'in_progress' })
      .expect(200);

    const viaDispute = await http()
      .patch(`/api/v1/bookings/${progressId}/cancel`)
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({})
      .expect(409);
    expect((viaDispute.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_CANCEL_VIA_DISPUTE',
    );
  });

  it('CS-M05-S09 liste + détail + timeline (RG-SEC-02)', async () => {
    const listed = await http()
      .get('/api/v1/bookings?group=past')
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(200);
    const past = (
      listed.body as Envelope<
        Array<{ id: string; status: string; addressSnapshot: { city: string } | null }>
      >
    ).data;
    expect(past.some((row) => row.id === bookingId && row.status === 'completed')).toBe(
      true,
    );
    expect(past.find((row) => row.id === bookingId)?.addressSnapshot?.city).toBe(
      'Lyon',
    );

    const cancelled = await http()
      .get('/api/v1/bookings?group=cancelled')
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(200);
    expect(
      (cancelled.body as Envelope<Array<{ status: string }>>).data.some((row) =>
        row.status.startsWith('cancelled_'),
      ),
    ).toBe(true);

    const detail = await http()
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(200);
    const payload = (
      detail.body as Envelope<{
        status: string;
        addressSnapshot: { street: string };
        timeline: Array<{ toStatus: string }>;
        provider: { companyName: string | null } | null;
      }>
    ).data;
    expect(payload.status).toBe('completed');
    expect(payload.addressSnapshot.street).toContain('République');
    expect(payload.timeline.map((row) => row.toStatus)).toEqual(
      expect.arrayContaining([
        'draft',
        'pending_provider',
        'accepted',
        'completed',
      ]),
    );
    expect(payload.provider).not.toBeNull();

    const assigned = await http()
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(200);
    expect(
      (assigned.body as Envelope<{ client: { phone: string } | null }>).data.client
        ?.phone,
    ).toBe(phones.client);

    const pending = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(),
      })
      .expect(201);
    const pendingId = (
      pending.body as Envelope<{ booking: { id: string } }>
    ).data.booking.id;

    const broadcast = await http()
      .get(`/api/v1/bookings/${pendingId}`)
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .expect(200);
    expect(
      (
        broadcast.body as Envelope<{
          addressSnapshot: unknown;
          client: unknown;
          zone: { slug: string };
        }>
      ).data,
    ).toMatchObject({
      addressSnapshot: null,
      client: null,
      zone: { slug: 'lyon' },
    });

    const forbidden = await http()
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${tokens.providerB}`)
      .expect(403);
    expect((forbidden.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_NOT_ASSIGNED',
    );
  });

  it('CS-M05-S10 créneaux J→J+14 avec capacité zone', async () => {
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

    const payload = (
      slots.body as Envelope<{
        durationMinutes: number;
        minBookingLeadHours: number;
        horizonDays: number;
        zone: { slug: string };
        days: Array<{
          date: string;
          slots: Array<{ start: string; available: boolean }>;
        }>;
      }>
    ).data;

    expect(payload.horizonDays).toBe(14);
    expect(payload.days).toHaveLength(15);
    expect(payload.zone.slug).toBe('lyon');
    expect(payload.durationMinutes).toBeGreaterThanOrEqual(90);
    expect(payload.minBookingLeadHours).toBe(2);

    const targetStart = futureSlotIso();
    const targetDate = targetStart.slice(0, 10);
    const day = payload.days.find((row) => row.date === targetDate);
    expect(day).toBeDefined();
    expect(
      day?.slots.some((slot) => slot.start === targetStart && slot.available),
    ).toBe(true);

    const unknown = await http()
      .post('/api/v1/bookings/slots')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: '00000000-0000-4000-8000-000000000000',
      })
      .expect(404);
    expect((unknown.body as ErrorEnvelope).error.code).toBe('ADDRESS_NOT_FOUND');
  });

  it('CS-M06-S04 webhook payment_failed expire le booking unpaid (RG-PAY-06)', async () => {
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
    const createdPayload = (
      created.body as Envelope<{
        booking: { id: string; status: string };
        payment: { paymentIntentId: string };
      }>
    ).data;
    expect(createdPayload.booking.status).toBe('pending_provider');

    const eventId = `evt_mock_${suffix}_payfail`;
    const webhook = await http()
      .post('/api/v1/webhooks/stripe')
      .send({
        id: eventId,
        type: 'payment_intent.payment_failed',
        data: { object: { id: createdPayload.payment.paymentIntentId } },
      })
      .expect(200);
    expect(
      (webhook.body as Envelope<{ received: boolean; duplicate: boolean }>)
        .data.received,
    ).toBe(true);

    const replay = await http()
      .post('/api/v1/webhooks/stripe')
      .send({
        id: eventId,
        type: 'payment_intent.payment_failed',
        data: { object: { id: createdPayload.payment.paymentIntentId } },
      })
      .expect(200);
    expect(
      (replay.body as Envelope<{ duplicate: boolean }>).data.duplicate,
    ).toBe(true);

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { bookingId: createdPayload.booking.id },
    });
    expect(payment.status).toBe('failed');
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: createdPayload.booking.id },
    });
    expect(booking.status).toBe('expired');
  });

  it('CS-M06-S05 refund admin libère l’auth (RG-PAY-05)', async () => {
    const adminPhone = `+33699${suffix}`;
    await prisma.user.create({
      data: { phone: adminPhone, role: 'admin', isActive: true },
    });
    const adminToken = await loginAdmin(http, adminPhone, userIds, prisma);

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
    const createdPayload = (
      created.body as Envelope<{ booking: { id: string } }>
    ).data;

    const refunded = await http()
      .post(`/api/v1/admin/bookings/${createdPayload.booking.id}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Geste commercial E2E' })
      .expect(200);
    expect(
      (
        refunded.body as Envelope<{
          status: string;
          paymentStatus: string;
          action: string;
        }>
      ).data,
    ).toMatchObject({
      status: 'cancelled_by_admin',
      paymentStatus: 'refunded',
      action: 'canceled_authorization',
    });

    const forbidden = await http()
      .post(`/api/v1/admin/bookings/${createdPayload.booking.id}/refund`)
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({})
      .expect(403);
    expect((forbidden.body as ErrorEnvelope).error.code).toBe('FORBIDDEN');
  });

  it('CS-M06-S06 account.updated synchronise charges_enabled', async () => {
    const stripeAccountId = `acct_e2e_${suffix}`;
    const provider = await prisma.user.findUniqueOrThrow({
      where: { phone: phones.providerA },
      include: { providerProfile: true },
    });
    await prisma.providerProfile.update({
      where: { id: provider.providerProfile!.id },
      data: { stripeAccountId, chargesEnabled: false },
    });

    const blocked = await http()
      .get('/api/v1/providers/missions/eligibility')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(403);
    expect((blocked.body as ErrorEnvelope).error.code).toBe(
      'STRIPE_CHARGES_DISABLED',
    );

    const webhook = await http()
      .post('/api/v1/webhooks/stripe')
      .send({
        id: `evt_mock_${suffix}_account`,
        type: 'account.updated',
        data: { object: { id: stripeAccountId, charges_enabled: true } },
      })
      .expect(200);
    expect(
      (webhook.body as Envelope<{ received: boolean; duplicate: boolean }>)
        .data,
    ).toEqual({ received: true, duplicate: false });

    const enabled = await prisma.providerProfile.findUniqueOrThrow({
      where: { id: provider.providerProfile!.id },
    });
    expect(enabled.chargesEnabled).toBe(true);

    const eligible = await http()
      .get('/api/v1/providers/missions/eligibility')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(200);
    expect(
      (eligible.body as Envelope<{ eligible: boolean }>).data.eligible,
    ).toBe(true);

    const me = await http()
      .get('/api/v1/providers/me')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .expect(200);
    expect(
      (me.body as Envelope<{ chargesEnabled: boolean; stripeAccountId: string }>)
        .data,
    ).toMatchObject({
      chargesEnabled: true,
      stripeAccountId,
    });
  });

  it('CS-M07-S02 POST /media/upload-url mock local', async () => {
    const created = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(11),
      })
      .expect(201);
    const bookingId = (
      created.body as Envelope<{ booking: { id: string } }>
    ).data.booking.id;

    const uploaded = await http()
      .post('/api/v1/media/upload-url')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        mimeType: 'image/jpeg',
        context: 'booking_photo',
        bookingId,
        photoType: 'before',
      })
      .expect(200);
    expect(
      (
        uploaded.body as Envelope<{
          uploadUrl: string;
          fileKey: string;
        }>
      ).data,
    ).toMatchObject({
      uploadUrl: expect.stringContaining('cdn.carservice.test/mock-upload/'),
      fileKey: expect.stringMatching(
        new RegExp(`^bookings/${bookingId}/before/.+\\.jpg$`),
      ),
    });

    const forbiddenMime = await http()
      .post('/api/v1/media/upload-url')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        mimeType: 'application/pdf',
        context: 'booking_photo',
        bookingId,
        photoType: 'before',
      })
      .expect(400);
    expect((forbiddenMime.body as ErrorEnvelope).error.code).toBe(
      'VALIDATION_ERROR',
    );
  });

  it('CS-M07-S03 POST /media/confirm attache booking_photos', async () => {
    const created = await http()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        offerId,
        vehicleType: 'suv',
        optionIds: [],
        addressId: clientAddressId,
        slotStart: futureSlotIso(12),
      })
      .expect(201);
    const bookingId = (
      created.body as Envelope<{ booking: { id: string } }>
    ).data.booking.id;

    const uploaded = await http()
      .post('/api/v1/media/upload-url')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        mimeType: 'image/jpeg',
        context: 'booking_photo',
        bookingId,
        photoType: 'before',
      })
      .expect(200);
    const fileKey = (
      uploaded.body as Envelope<{ fileKey: string }>
    ).data.fileKey;

    const confirmed = await http()
      .post('/api/v1/media/confirm')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({ fileKey })
      .expect(200);
    const photo = (
      confirmed.body as Envelope<{
        id: string;
        bookingId: string;
        photoType: string;
        uploadedBy: string;
        fileUrl: string;
      }>
    ).data;
    expect(photo).toMatchObject({
      bookingId,
      photoType: 'before',
      uploadedBy: 'client',
      fileUrl: `https://cdn.carservice.test/${fileKey}`,
    });
    expect(photo.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const again = await http()
      .post('/api/v1/media/confirm')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({ fileKey })
      .expect(200);
    expect((again.body as Envelope<{ id: string }>).data.id).toBe(photo.id);

    const detail = await http()
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(200);
    expect(
      (
        detail.body as Envelope<{
          photos: Array<{ photoType: string; uploadedBy: string }>;
        }>
      ).data.photos,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          photoType: 'before',
          uploadedBy: 'client',
        }),
      ]),
    );

    const invalidKey = await http()
      .post('/api/v1/media/confirm')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({ fileKey: 'not-a-key.jpg' })
      .expect(400);
    expect((invalidKey.body as ErrorEnvelope).error.code).toBe(
      'MEDIA_FILE_KEY_INVALID',
    );

    const kycUploaded = await http()
      .post('/api/v1/media/upload-url')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ mimeType: 'application/pdf', context: 'kyc_document' })
      .expect(200);
    const kycKey = (
      kycUploaded.body as Envelope<{ fileKey: string }>
    ).data.fileKey;

    const kycConfirmed = await http()
      .post('/api/v1/media/confirm')
      .set('Authorization', `Bearer ${tokens.providerA}`)
      .send({ fileKey: kycKey })
      .expect(200);
    expect(
      (
        kycConfirmed.body as Envelope<{
          id: string | null;
          bookingId: string | null;
          uploadedBy: string | null;
        }>
      ).data,
    ).toMatchObject({
      id: null,
      bookingId: null,
      uploadedBy: 'provider',
    });

    const forbiddenKyc = await http()
      .post('/api/v1/media/confirm')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({ fileKey: kycKey })
      .expect(403);
    expect((forbiddenKyc.body as ErrorEnvelope).error.code).toBe('FORBIDDEN');
  });
});
