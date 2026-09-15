import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app';
import {
  cleanupUsers,
  Envelope,
  ErrorEnvelope,
  login,
  loginAdmin,
} from './e2e-helpers';

/**
 * Gate fin de module M15 : addresses CRUD, clients/me + RG-SEC-03, admin users disable.
 */
describe('E2E M15 Backend closure — gate module', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  const suffix = `${Date.now()}`.slice(-6);
  const phones = {
    client: `+33615${suffix}`,
    admin: `+33616${suffix}`,
    other: `+33617${suffix}`,
  };
  const tokens: Record<string, string> = {};
  const userIds: string[] = [];
  let addressId = '';
  let clientUserId = '';

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    http = () => request(app.getHttpServer());

    tokens.client = await login(http, phones.client, 'client', userIds, prisma);
    tokens.admin = await loginAdmin(http, phones.admin, userIds, prisma);
    tokens.other = await login(http, phones.other, 'client', userIds, prisma);

    const me = await http()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(200);
    clientUserId = (me.body as Envelope<{ id: string }>).data.id;
  });

  afterAll(async () => {
    if (addressId) {
      await prisma.address.deleteMany({ where: { id: addressId } });
    }
    await cleanupUsers(prisma, userIds);
    await app.close();
  });

  it('CRUD /addresses (ownership client)', async () => {
    const created = await http()
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        label: 'Maison M15',
        street: '10 rue de la République',
        city: 'Lyon',
        postalCode: '69002',
        lat: 45.764,
        lng: 4.8357,
      })
      .expect(201);

    const address = (
      created.body as Envelope<{ id: string; street: string }>
    ).data;
    addressId = address.id;
    expect(address.street).toContain('République');

    const listed = await http()
      .get('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(200);
    expect(
      (listed.body as Envelope<Array<{ id: string }>>).data.some(
        (row) => row.id === addressId,
      ),
    ).toBe(true);

    await http()
      .patch(`/api/v1/addresses/${addressId}`)
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({ label: 'Bureau M15' })
      .expect(200);

    const stolen = await http()
      .patch(`/api/v1/addresses/${addressId}`)
      .set('Authorization', `Bearer ${tokens.other}`)
      .send({ label: 'Hack' })
      .expect(404);
    expect((stolen.body as ErrorEnvelope).error.code).toBe('ADDRESS_NOT_FOUND');
  });

  it('GET/PATCH /clients/me puis DELETE RG-SEC-03', async () => {
    const profile = await http()
      .get('/api/v1/clients/me')
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(200);
    expect(
      (profile.body as Envelope<{ phone: string }>).data.phone,
    ).toBe(phones.client);

    await http()
      .patch('/api/v1/clients/me')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({ firstName: 'Ada', lastName: 'Lovelace' })
      .expect(200);

    const deleted = await http()
      .delete('/api/v1/clients/me')
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(200);
    expect(
      (deleted.body as Envelope<{ deleted: true }>).data.deleted,
    ).toBe(true);

    const user = await prisma.user.findUnique({ where: { id: clientUserId } });
    expect(user?.isActive).toBe(false);
    expect(user?.phone.startsWith('del_')).toBe(true);

    await http()
      .get('/api/v1/clients/me')
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(404);
  });

  it('GET/PATCH /admin/users soft-disable', async () => {
    const list = await http()
      .get(`/api/v1/admin/users?q=${encodeURIComponent(phones.other)}&role=client`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);
    const items = (
      list.body as Envelope<{
        items: Array<{ id: string; phone: string; isActive: boolean }>;
        total: number;
      }>
    ).data.items;
    expect(items.length).toBeGreaterThanOrEqual(1);
    const target = items.find((row) => row.phone === phones.other);
    expect(target).toBeTruthy();

    const updated = await http()
      .patch(`/api/v1/admin/users/${target!.id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ isActive: false })
      .expect(200);
    expect(
      (updated.body as Envelope<{ isActive: boolean }>).data.isActive,
    ).toBe(false);

    await http()
      .patch(`/api/v1/admin/users/${target!.id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ isActive: true })
      .expect(200);
  });
});
