import { Prisma, UserRole } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';

export const E2E_OTP = '123456';
export const E2E_LYON = { lat: 45.764, lng: 4.8357 };

export type Envelope<T> = { data: T; meta?: { requestId: string } };
export type ErrorEnvelope = {
  error: { code: string; message: string };
  meta?: { requestId: string };
};
export type Http = () => ReturnType<typeof request>;

export async function loadCatalogSeed(prisma: PrismaService) {
  const zone = await prisma.serviceZone.findUnique({
    where: { slug: 'lyon' },
  });
  const offer = await prisma.serviceOffer.findUnique({
    where: { slug: 'wash-complete' },
    include: { options: { where: { slug: 'pet-hair' } } },
  });

  if (!zone || !offer) {
    throw new Error(
      'Seed catalogue manquant — lancer `pnpm --filter @carservice/api prisma:seed`',
    );
  }

  return {
    zoneId: zone.id,
    offerId: offer.id,
    optionId: offer.options[0]?.id ?? '',
  };
}

export async function login(
  http: Http,
  phone: string,
  role: 'client' | 'provider',
  userIds: string[],
  prisma: PrismaService,
): Promise<string> {
  await http().post('/api/v1/auth/otp/send').send({ phone, role }).expect(201);

  const verified = await http()
    .post('/api/v1/auth/otp/verify')
    .send({ phone, role, code: E2E_OTP, acceptTerms: true })
    .expect(201);

  const data = (
    verified.body as Envelope<{
      accessToken: string;
      user: { id: string };
    }>
  ).data;
  userIds.push(data.user.id);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: data.user.id },
  });
  expect(user.role).toBe(role === 'client' ? UserRole.client : UserRole.provider);

  return data.accessToken;
}

/** Admin OTP uses role `client`; existing admin users keep `UserRole.admin`. */
export async function loginAdmin(
  http: Http,
  phone: string,
  userIds: string[],
  prisma: PrismaService,
): Promise<string> {
  await http()
    .post('/api/v1/auth/otp/send')
    .send({ phone, role: 'client' })
    .expect(201);

  const verified = await http()
    .post('/api/v1/auth/otp/verify')
    .send({ phone, role: 'client', code: E2E_OTP, acceptTerms: true })
    .expect(201);

  const data = (
    verified.body as Envelope<{
      accessToken: string;
      user: { id: string; role: string };
    }>
  ).data;
  userIds.push(data.user.id);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: data.user.id },
  });
  expect(user.role).toBe(UserRole.admin);
  expect(data.user.role).toBe('admin');

  return data.accessToken;
}

export function futureSlotIso(daysAhead = 7): string {
  const slot = new Date();
  slot.setUTCDate(slot.getUTCDate() + daysAhead);
  slot.setUTCHours(10, 0, 0, 0);
  return slot.toISOString();
}

export async function attachProviderBaseAddresses(
  prisma: PrismaService,
  phones: string[],
) {
  for (const phone of phones) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { phone },
      include: { providerProfile: true },
    });
    if (!user.providerProfile) {
      continue;
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label: 'Base E2E',
        street: '20 rue Mercière',
        city: 'Lyon',
        postalCode: '69002',
        country: 'FR',
        lat: new Prisma.Decimal('45.7600000'),
        lng: new Prisma.Decimal('4.8300000'),
      },
    });

    await prisma.providerProfile.update({
      where: { id: user.providerProfile.id },
      data: { baseAddressId: address.id },
    });
  }
}

export async function createClientAddress(
  prisma: PrismaService,
  phone: string,
) {
  const client = await prisma.user.findUniqueOrThrow({ where: { phone } });
  const address = await prisma.address.create({
    data: {
      userId: client.id,
      label: 'E2E Maison',
      street: '10 rue de la République',
      complement: null,
      city: 'Lyon',
      postalCode: '69002',
      country: 'FR',
      lat: new Prisma.Decimal(E2E_LYON.lat.toFixed(7)),
      lng: new Prisma.Decimal(E2E_LYON.lng.toFixed(7)),
      instructions: 'Digicode 12',
    },
  });
  return address.id;
}

export async function submitAndApproveKyc(
  http: Http,
  prisma: PrismaService,
  token: string,
  phone: string,
  siret: string,
  washMethods: Array<'waterless' | 'steam'>,
) {
  await http()
    .post('/api/v1/providers/kyc/submit')
    .set('Authorization', `Bearer ${token}`)
    .send({
      siret,
      washMethods,
      documents: [
        {
          docType: 'rc_pro',
          fileUrl: `https://cdn.carservice.test/rc-${siret}.pdf`,
          expiresAt: '2027-12-31',
        },
      ],
    })
    .expect(201);

  await prisma.providerProfile.update({
    where: { userId: (await prisma.user.findUniqueOrThrow({ where: { phone } })).id },
    data: { kycStatus: 'approved' },
  });
}

export async function configureProviderOps(
  http: Http,
  token: string,
  offerId: string,
  zoneId: string,
) {
  const weeklySlots = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    startTime: '08:00',
    endTime: '20:00',
    isActive: true,
  }));

  await http()
    .put('/api/v1/providers/capabilities')
    .set('Authorization', `Bearer ${token}`)
    .send({ offerIds: [offerId] })
    .expect(200);
  await http()
    .put('/api/v1/providers/availability')
    .set('Authorization', `Bearer ${token}`)
    .send({ weeklySlots, blockedSlots: [] })
    .expect(200);
  await http()
    .put('/api/v1/providers/zones')
    .set('Authorization', `Bearer ${token}`)
    .send({ zones: [{ zoneId, radiusKm: 25 }] })
    .expect(200);
}

export async function cleanupUsers(prisma: PrismaService, userIds: string[]) {
  if (userIds.length === 0) {
    return;
  }

  const profiles = await prisma.providerProfile.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const clients = await prisma.clientProfile.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });

  await prisma.booking.deleteMany({
    where: {
      OR: [
        { clientId: { in: clients.map((row) => row.id) } },
        { providerId: { in: profiles.map((row) => row.id) } },
      ],
    },
  });
  await prisma.address.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
