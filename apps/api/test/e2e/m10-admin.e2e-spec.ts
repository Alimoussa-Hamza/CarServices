import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app';
import {
  cleanupUsers,
  Envelope,
  ErrorEnvelope,
  loadCatalogSeed,
  login,
  loginAdmin,
} from './e2e-helpers';

/**
 * Gate fin de module M10 : admin auth, dashboard, KYC queue, catalog, zones.
 */
describe('E2E M10 Admin — gate module', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  const suffix = `${Date.now()}`.slice(-6);
  const phones = {
    admin: `+33610${suffix}`,
    client: `+33611${suffix}`,
    provider: `+33612${suffix}`,
  };
  const tokens: Record<string, string> = {};
  const userIds: string[] = [];
  let categoryId = '';
  let offerId = '';
  let createdOfferId = '';
  let createdZoneId = '';

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    http = () => request(app.getHttpServer());

    const catalog = await loadCatalogSeed(prisma);
    categoryId = catalog.categoryId;
    offerId = catalog.offerId;

    tokens.admin = await loginAdmin(http, phones.admin, userIds, prisma);
    tokens.client = await login(http, phones.client, 'client', userIds, prisma);
    tokens.provider = await login(
      http,
      phones.provider,
      'provider',
      userIds,
      prisma,
    );
  });

  afterAll(async () => {
    if (createdOfferId) {
      await prisma.offerOption.deleteMany({ where: { offerId: createdOfferId } });
      await prisma.serviceOffer.deleteMany({ where: { id: createdOfferId } });
    }
    if (createdZoneId) {
      await prisma.zonePricing.deleteMany({ where: { zoneId: createdZoneId } });
      await prisma.$executeRaw`DELETE FROM service_zones WHERE id = ${createdZoneId}::uuid`;
    }
    await cleanupUsers(prisma, userIds);
    await app.close();
  });

  it('dashboard + pending + approve KYC', async () => {
    const dash = await http()
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);
    expect((dash.body as Envelope<Record<string, unknown>>).data).toBeTruthy();

    await http()
      .post('/api/v1/providers/kyc/submit')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({
        siret: `10${suffix}000001`,
        washMethods: ['waterless'],
        documents: [
          {
            docType: 'rc_pro',
            fileUrl: `https://cdn.carservice.test/rc-m10-${suffix}.pdf`,
            expiresAt: '2027-12-31',
          },
        ],
      })
      .expect(201);

    const pending = await http()
      .get('/api/v1/admin/providers/pending')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);
    const rows = (
      pending.body as Envelope<{
        items: Array<{ id: string; phone: string }>;
        total: number;
      }>
    ).data.items;
    const item = rows.find((row) => row.phone === phones.provider);
    expect(item).toBeTruthy();

    const approved = await http()
      .post(`/api/v1/admin/providers/${item!.id}/approve`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);
    expect(
      (approved.body as Envelope<{ kycStatus: string }>).data.kycStatus,
    ).toBe('approved');
  });

  it('catalog admin create + option + soft-disable invisible public', async () => {
    const slug = `wash-m10-${suffix}`;
    const created = await http()
      .post('/api/v1/admin/catalog/offers')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        categoryId,
        slug,
        name: `Offre m10 ${suffix}`,
        basePriceCents: 8800,
        durationMinutes: 70,
        formSchema: { fields: [] },
        checklistTemplate: { items: [] },
        isActive: true,
        sortOrder: 50,
      })
      .expect(201);
    const offer = (
      created.body as Envelope<{ id: string; slug: string; isActive: boolean }>
    ).data;
    createdOfferId = offer.id;
    expect(offer).toMatchObject({ slug, isActive: true });

    await http()
      .get('/api/v1/admin/catalog/offers')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    await http()
      .get(`/api/v1/admin/catalog/offers/${offer.id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    await http()
      .post(`/api/v1/admin/catalog/offers/${offer.id}/options`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        slug: `opt-m10-${suffix}`,
        name: 'Option m10',
        priceDeltaCents: 400,
        durationDeltaMinutes: 5,
      })
      .expect(201);

    await http()
      .patch(`/api/v1/admin/catalog/offers/${offer.id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ isActive: false })
      .expect(200);

    const publicOffers = await http().get('/api/v1/catalog/offers').expect(200);
    expect(
      (publicOffers.body as Envelope<Array<{ slug: string }>>).data.some(
        (row) => row.slug === slug,
      ),
    ).toBe(false);

    await http()
      .get('/api/v1/admin/catalog/categories')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);
  });

  it('zones admin create + activate + pricing', async () => {
    const slug = `zone-m10-${suffix}`;
    const created = await http()
      .post('/api/v1/admin/zones')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        name: `Zone m10 ${suffix}`,
        slug,
        polygon: [
          { lat: 45.76, lng: 4.86 },
          { lat: 45.76, lng: 4.91 },
          { lat: 45.81, lng: 4.91 },
          { lat: 45.81, lng: 4.86 },
        ],
        isActive: false,
        priceCoefficient: 1.02,
        minBookingLeadHours: 2,
      })
      .expect(201);
    const zone = (
      created.body as Envelope<{ id: string; slug: string; isActive: boolean }>
    ).data;
    createdZoneId = zone.id;
    expect(zone).toMatchObject({ slug, isActive: false });

    await http()
      .patch(`/api/v1/admin/zones/${zone.id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ isActive: true })
      .expect(200);

    await http()
      .put(`/api/v1/admin/zones/${zone.id}/pricing/${offerId}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        priceOverrideCents: 8800,
        vehicleSurcharges: {
          citadine: 0,
          berline: 500,
          suv: 1000,
          utilitaire: 1500,
          moto: 0,
        },
      })
      .expect(200);

    const list = await http()
      .get('/api/v1/admin/zones')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);
    expect(
      (list.body as Envelope<Array<{ slug: string }>>).data.some(
        (row) => row.slug === slug,
      ),
    ).toBe(true);
  });

  it('bookings admin list + detail (search vide OK)', async () => {
    const listed = await http()
      .get('/api/v1/admin/bookings?page=1&pageSize=5')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);
    const payload = (
      listed.body as Envelope<{
        items: unknown[];
        total: number;
        page: number;
        pageSize: number;
      }>
    ).data;
    expect(payload).toMatchObject({ page: 1, pageSize: 5 });
    expect(Array.isArray(payload.items)).toBe(true);

    const missing = await http()
      .get('/api/v1/admin/bookings/00000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(404);
    expect((missing.body as ErrorEnvelope).error.code).toBe('BOOKING_NOT_FOUND');
  });

  it('disputes admin list vide OK', async () => {
    const listed = await http()
      .get('/api/v1/admin/disputes')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);
    expect(
      (listed.body as Envelope<{ items: unknown[]; page: number }>).data.page,
    ).toBe(1);
  });

  it('refuse accès admin aux non-admins', async () => {
    const denied = await http()
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(403);
    expect((denied.body as ErrorEnvelope).error.code).toMatch(/FORBIDDEN|ROLE/i);
  });
});
