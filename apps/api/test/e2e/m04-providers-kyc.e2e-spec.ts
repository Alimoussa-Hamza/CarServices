import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app';
import {
  cleanupUsers,
  configureProviderOps,
  Envelope,
  ErrorEnvelope,
  loadCatalogSeed,
  login,
  loginAdmin,
  submitAndApproveKyc,
} from './e2e-helpers';

/**
 * Gate fin de module M04 : KYC submit/approve/reject + ops pro + eligibility.
 */
describe('E2E M04 Providers & KYC — gate module', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  const suffix = `${Date.now()}`.slice(-6);
  const phones = {
    provider: `+33641${suffix}`,
    draft: `+33642${suffix}`,
    reject: `+33643${suffix}`,
    admin: `+33694${suffix}`,
  };
  const tokens: Record<string, string> = {};
  const userIds: string[] = [];

  let offerId = '';
  let zoneId = '';

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    http = () => request(app.getHttpServer());

    const catalog = await loadCatalogSeed(prisma);
    offerId = catalog.offerId;
    zoneId = catalog.zoneId;

    tokens.provider = await login(
      http,
      phones.provider,
      'provider',
      userIds,
      prisma,
    );
    tokens.draft = await login(http, phones.draft, 'provider', userIds, prisma);
    tokens.reject = await login(
      http,
      phones.reject,
      'provider',
      userIds,
      prisma,
    );
    tokens.admin = await loginAdmin(http, phones.admin, userIds, prisma);
  });

  afterAll(async () => {
    await cleanupUsers(prisma, userIds);
    await app.close();
  });

  it('draft bloqué · submit · approve · capabilities/dispo/zones · stripe onboard', async () => {
    const blocked = await http()
      .get('/api/v1/providers/missions/eligibility')
      .set('Authorization', `Bearer ${tokens.draft}`)
      .expect(403);
    expect((blocked.body as ErrorEnvelope).error.code).toBe('KYC_NOT_APPROVED');

    const me = await http()
      .get('/api/v1/providers/me')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(200);
    expect(
      (me.body as Envelope<{ kycStatus?: string }>).data.kycStatus ?? 'draft',
    ).toMatch(/draft|pending|approved/i);

    await submitAndApproveKyc(
      http,
      prisma,
      tokens.provider,
      phones.provider,
      `41${suffix}000001`,
      ['waterless'],
    );

    const status = await http()
      .get('/api/v1/providers/kyc/status')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(200);
    expect(
      (status.body as Envelope<{ status?: string; kycStatus?: string }>).data,
    ).toBeTruthy();

    await http()
      .get('/api/v1/providers/kyc/alerts')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(200);

    await configureProviderOps(http, tokens.provider, offerId, zoneId);

    const eligible = await http()
      .get('/api/v1/providers/missions/eligibility')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(200);
    expect(
      (eligible.body as Envelope<{ eligible: boolean; kycStatus: string }>)
        .data,
    ).toEqual({ eligible: true, kycStatus: 'approved' });

    const stripe = await http()
      .post('/api/v1/providers/stripe/onboard')
      .set('Authorization', `Bearer ${tokens.provider}`)
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

  it('admin reject KYC → pro non éligible', async () => {
    await http()
      .post('/api/v1/providers/kyc/submit')
      .set('Authorization', `Bearer ${tokens.reject}`)
      .send({
        siret: `43${suffix}000001`,
        washMethods: ['steam'],
        documents: [
          {
            docType: 'rc_pro',
            fileUrl: `https://cdn.carservice.test/rc-reject-${suffix}.pdf`,
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
    const item = rows.find((row) => row.phone === phones.reject);
    expect(item).toBeTruthy();

    await http()
      .post(`/api/v1/admin/providers/${item!.id}/reject`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ reason: 'Documents incomplets e2e' })
      .expect(200);

    const blocked = await http()
      .get('/api/v1/providers/missions/eligibility')
      .set('Authorization', `Bearer ${tokens.reject}`)
      .expect(403);
    expect((blocked.body as ErrorEnvelope).error.code).toBe('KYC_NOT_APPROVED');
  });
});
