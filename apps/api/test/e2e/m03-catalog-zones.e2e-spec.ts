import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app';
import {
  E2E_LYON as LYON,
  Envelope,
  loadCatalogSeed,
} from './e2e-helpers';

/**
 * Gate fin de module M03 : catalogue public + quote + zones PostGIS.
 */
describe('E2E M03 Catalog & Zones — gate module', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  let offerId = '';
  let optionId = '';

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    http = () => request(app.getHttpServer());
    const catalog = await loadCatalogSeed(prisma);
    offerId = catalog.offerId;
    optionId = catalog.optionId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('catégories + offres + détail + quote', async () => {
    const categories = await http().get('/api/v1/catalog/categories').expect(200);
    expect(
      (categories.body as Envelope<Array<{ slug: string }>>).data.some(
        (row) => row.slug === 'wash',
      ),
    ).toBe(true);

    const offers = await http()
      .get('/api/v1/catalog/offers')
      .query({ zone: 'lyon' })
      .expect(200);
    const offerList = (offers.body as Envelope<Array<{ id: string; slug: string }>>)
      .data;
    expect(offerList.some((row) => row.slug === 'wash-complete')).toBe(true);

    const detail = await http()
      .get(`/api/v1/catalog/offers/${offerId}`)
      .expect(200);
    expect(
      (detail.body as Envelope<{ id: string; options?: unknown[] }>).data.id,
    ).toBe(offerId);

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
  });

  it('zone Lyon couverte + hors zone + lead', async () => {
    const covered = await http()
      .post('/api/v1/zones/check')
      .send({ lat: LYON.lat, lng: LYON.lng })
      .expect(200);
    expect(
      (covered.body as Envelope<{ covered: boolean; zone?: { slug: string } }>)
        .data,
    ).toMatchObject({ covered: true, zone: { slug: 'lyon' } });

    const outside = await http()
      .post('/api/v1/zones/check')
      .send({ lat: 48.8566, lng: 2.3522 })
      .expect(200);
    expect(
      (outside.body as Envelope<{ covered: boolean }>).data.covered,
    ).toBe(false);

    const suffix = `${Date.now()}`.slice(-6);
    const lead = await http()
      .post('/api/v1/zones/leads')
      .send({
        email: `lead-${suffix}@carservice.test`,
        phone: `+33603${suffix}`,
        lat: 48.8566,
        lng: 2.3522,
        addressText: 'Paris hors zone e2e',
      })
      .expect(201);
    expect(
      (lead.body as Envelope<{ captured: boolean }>).data.captured,
    ).toBe(true);
  });
});
