import { INestApplication } from '@nestjs/common';
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
  providerCompletionPhotos,
  submitAndApproveKyc,
} from './e2e-helpers';

/**
 * Gate fin de module M06 : parcours isolé (ne dépend pas de platform-flow).
 * Couvre pre-auth → capture / refund / webhook / charges_enabled avant d’ouvrir M07.
 */
describe('E2E M06 Payments — gate module', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  const suffix = `${Date.now()}`.slice(-6);
  const phones = {
    client: `+33621${suffix}`,
    provider: `+33622${suffix}`,
    admin: `+33629${suffix}`,
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
      `21${suffix}000001`,
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

  async function createBooking(daysAhead: number) {
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
    return (
      created.body as Envelope<{
        booking: { id: string; status: string };
        payment: { paymentIntentId: string; clientSecret: string };
      }>
    ).data;
  }

  it('parcours complet : pre-auth → accept → capture à completed (RG-PAY-01/02/03)', async () => {
    const created = await createBooking(7);
    expect(created.booking.status).toBe('pending_provider');
    expect(created.payment.paymentIntentId).toMatch(/^pi_mock_/);
    expect(created.payment.clientSecret).toContain('secret');

    const authorized = await prisma.payment.findUniqueOrThrow({
      where: { bookingId: created.booking.id },
    });
    expect(authorized.status).toBe('authorized');
    expect(authorized.commissionCents).toBe(
      Math.round(authorized.amountCents * 0.2),
    );
    expect(authorized.commissionCents + authorized.providerNetCents).toBe(
      authorized.amountCents,
    );

    await http()
      .post(`/api/v1/bookings/${created.booking.id}/accept`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(201);
    await http()
      .patch(`/api/v1/bookings/${created.booking.id}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'en_route' })
      .expect(200);
    await http()
      .patch(`/api/v1/bookings/${created.booking.id}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'in_progress', lat: 45.764, lng: 4.8357 })
      .expect(200);

    await prisma.bookingPhoto.createMany({
      data: providerCompletionPhotos(
        created.booking.id,
        'https://cdn.carservice.test/m06',
      ),
    });
    await http()
      .patch(`/api/v1/bookings/${created.booking.id}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'completed' })
      .expect(200);

    const captured = await prisma.payment.findUniqueOrThrow({
      where: { bookingId: created.booking.id },
    });
    expect(captured.status).toBe('captured');
    expect(captured.capturedAt).not.toBeNull();
  });

  it('refuse les cas P0 : payment_failed, cancel refund, admin refund, charges_enabled', async () => {
    const unpaid = await createBooking(8);
    expect(unpaid.booking.status).toBe('pending_provider');
    const failEventId = `evt_m06_${suffix}_payfail`;
    const failed = await http()
      .post('/api/v1/webhooks/stripe')
      .send({
        id: failEventId,
        type: 'payment_intent.payment_failed',
        data: { object: { id: unpaid.payment.paymentIntentId } },
      })
      .expect(200);
    expect(
      (failed.body as Envelope<{ received: boolean; duplicate: boolean }>).data,
    ).toEqual({ received: true, duplicate: false });

    const replay = await http()
      .post('/api/v1/webhooks/stripe')
      .send({
        id: failEventId,
        type: 'payment_intent.payment_failed',
        data: { object: { id: unpaid.payment.paymentIntentId } },
      })
      .expect(200);
    expect(
      (replay.body as Envelope<{ duplicate: boolean }>).data.duplicate,
    ).toBe(true);

    const failedPayment = await prisma.payment.findUniqueOrThrow({
      where: { bookingId: unpaid.booking.id },
    });
    expect(failedPayment.status).toBe('failed');
    const expired = await prisma.booking.findUniqueOrThrow({
      where: { id: unpaid.booking.id },
    });
    expect(expired.status).toBe('expired');

    const free = await createBooking(9);
    await http()
      .patch(`/api/v1/bookings/${free.booking.id}/cancel`)
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({})
      .expect(200);
    const refunded = await prisma.payment.findUniqueOrThrow({
      where: { bookingId: free.booking.id },
    });
    expect(refunded.status).toBe('refunded');

    const adminTarget = await createBooking(10);
    const adminRefund = await http()
      .post(`/api/v1/admin/bookings/${adminTarget.booking.id}/refund`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ reason: 'Gate M06 geste commercial' })
      .expect(200);
    expect(
      (
        adminRefund.body as Envelope<{
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
      .post(`/api/v1/admin/bookings/${adminTarget.booking.id}/refund`)
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({})
      .expect(403);
    expect((forbidden.body as ErrorEnvelope).error.code).toBe('FORBIDDEN');

    const stripeAccountId = `acct_m06_${suffix}`;
    const provider = await prisma.user.findUniqueOrThrow({
      where: { phone: phones.provider },
      include: { providerProfile: true },
    });
    await prisma.providerProfile.update({
      where: { id: provider.providerProfile!.id },
      data: { stripeAccountId, chargesEnabled: false },
    });
    const blocked = await http()
      .get('/api/v1/providers/missions/eligibility')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(403);
    expect((blocked.body as ErrorEnvelope).error.code).toBe(
      'STRIPE_CHARGES_DISABLED',
    );

    await http()
      .post('/api/v1/webhooks/stripe')
      .send({
        id: `evt_m06_${suffix}_account`,
        type: 'account.updated',
        data: { object: { id: stripeAccountId, charges_enabled: true } },
      })
      .expect(200);
    const synced = await prisma.providerProfile.findUniqueOrThrow({
      where: { id: provider.providerProfile!.id },
    });
    expect(synced.chargesEnabled).toBe(true);
    await http()
      .get('/api/v1/providers/missions/eligibility')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(200);
  });
});
