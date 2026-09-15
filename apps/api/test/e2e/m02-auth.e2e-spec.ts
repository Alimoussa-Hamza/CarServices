import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app';
import {
  cleanupUsers,
  Envelope,
  ErrorEnvelope,
  E2E_OTP,
  login,
  loginAdmin,
} from './e2e-helpers';

/**
 * Gate fin de module M02 : auth OTP → JWT → me → refresh rotation → logout + admin login.
 */
describe('E2E M02 Auth — gate module', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  const suffix = `${Date.now()}`.slice(-6);
  const phone = `+33602${suffix}`;
  const userIds: string[] = [];

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    http = () => request(app.getHttpServer());
  });

  afterAll(async () => {
    await cleanupUsers(prisma, userIds);
    await app.close();
  });

  it('parcours OTP client : send → verify → me → refresh → logout', async () => {
    await http()
      .post('/api/v1/auth/otp/send')
      .send({ phone, role: 'client' })
      .expect(201);

    const verified = await http()
      .post('/api/v1/auth/otp/verify')
      .send({ phone, role: 'client', code: E2E_OTP, acceptTerms: true })
      .expect(201);

    const tokens = (
      verified.body as Envelope<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; role: string };
      }>
    ).data;
    userIds.push(tokens.user.id);
    expect(tokens.user.role).toBe('client');
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    const me = await http()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(200);
    expect((me.body as Envelope<{ phone: string }>).data.phone).toBe(phone);

    const rotated = await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken })
      .expect(201);
    const newRefresh = (
      rotated.body as Envelope<{ refreshToken: string; accessToken: string }>
    ).data.refreshToken;
    expect(newRefresh).toBeTruthy();
    expect(newRefresh).not.toBe(tokens.refreshToken);

    const replay = await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken })
      .expect(401);
    expect((replay.body as ErrorEnvelope).error.code).toMatch(/REFRESH/i);

    await http()
      .post('/api/v1/auth/logout')
      .set(
        'Authorization',
        `Bearer ${(rotated.body as Envelope<{ accessToken: string }>).data.accessToken}`,
      )
      .send({ refreshToken: newRefresh })
      .expect(201);

    const afterLogout = await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: newRefresh })
      .expect(401);
    expect((afterLogout.body as ErrorEnvelope).error.code).toMatch(/REFRESH/i);
  });

  it('refuse OTP invalide et protège /auth/me', async () => {
    const other = `+33622${suffix}`;
    await http()
      .post('/api/v1/auth/otp/send')
      .send({ phone: other, role: 'client' })
      .expect(201);

    const bad = await http()
      .post('/api/v1/auth/otp/verify')
      .send({ phone: other, role: 'client', code: '000000', acceptTerms: true })
      .expect(401);
    expect((bad.body as ErrorEnvelope).error.code).toMatch(/OTP/i);

    await http().get('/api/v1/auth/me').expect(401);
  });

  it('admin login email/password + mauvais credentials', async () => {
    const adminPhone = `+33692${suffix}`;
    const token = await loginAdmin(http, adminPhone, userIds, prisma);
    const me = await http()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect((me.body as Envelope<{ role: string }>).data.role).toBe('admin');

    const email = `admin-${adminPhone.replace(/\D/g, '')}@carservice.test`;
    const fail = await http()
      .post('/api/v1/auth/admin/login')
      .send({ email, password: 'WrongPassword1!' })
      .expect(401);
    expect((fail.body as ErrorEnvelope).error.code).toBe(
      'AUTH_INVALID_CREDENTIALS',
    );

    // helper login also used for provider sanity
    await login(http, `+33632${suffix}`, 'provider', userIds, prisma);
  });
});
