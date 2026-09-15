import { INestApplication } from '@nestjs/common';
import {
  BOOKING_MIN_AFTER_PHOTOS,
  BOOKING_MIN_BEFORE_PHOTOS,
} from '@carservice/shared-types';
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
  submitAndApproveKyc,
} from './e2e-helpers';

/**
 * Gate fin de module M07 : parcours isolé (ne dépend pas de platform-flow).
 * Couvre upload-url → confirm → quota 2/2 photos pro avant d’ouvrir M08.
 */
describe('E2E M07 Media — gate module', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  const suffix = `${Date.now()}`.slice(-6);
  const phones = {
    client: `+33631${suffix}`,
    provider: `+33632${suffix}`,
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

    await submitAndApproveKyc(
      http,
      prisma,
      tokens.provider,
      phones.provider,
      `31${suffix}000001`,
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
    return (created.body as Envelope<{ booking: { id: string } }>).data.booking
      .id;
  }

  async function goToInProgress(bookingId: string) {
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
      .send({ status: 'in_progress', lat: 45.764, lng: 4.8357 })
      .expect(200);
  }

  async function confirmBookingPhoto(
    token: string,
    bookingId: string,
    photoType: 'before' | 'after',
  ) {
    const uploaded = await http()
      .post('/api/v1/media/upload-url')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mimeType: 'image/jpeg',
        context: 'booking_photo',
        bookingId,
        photoType,
      })
      .expect(200);
    const fileKey = (uploaded.body as Envelope<{ fileKey: string }>).data
      .fileKey;

    const confirmed = await http()
      .post('/api/v1/media/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ fileKey })
      .expect(200);
    return (
      confirmed.body as Envelope<{
        id: string;
        photoType: string;
        uploadedBy: string;
        fileKey: string;
      }>
    ).data;
  }

  it('parcours complet : upload-url + confirm 2 before / 2 after puis completed', async () => {
    const bookingId = await createBooking(7);
    await goToInProgress(bookingId);

    for (let i = 0; i < BOOKING_MIN_BEFORE_PHOTOS; i += 1) {
      const photo = await confirmBookingPhoto(
        tokens.provider,
        bookingId,
        'before',
      );
      expect(photo).toMatchObject({
        photoType: 'before',
        uploadedBy: 'provider',
      });
    }
    for (let i = 0; i < BOOKING_MIN_AFTER_PHOTOS; i += 1) {
      const photo = await confirmBookingPhoto(
        tokens.provider,
        bookingId,
        'after',
      );
      expect(photo).toMatchObject({
        photoType: 'after',
        uploadedBy: 'provider',
      });
    }

    const completed = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'completed' })
      .expect(200);
    expect((completed.body as Envelope<{ status: string }>).data.status).toBe(
      'completed',
    );

    const detail = await http()
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(200);
    const photos = (
      detail.body as Envelope<{
        photos: Array<{ photoType: string; uploadedBy: string }>;
      }>
    ).data.photos;
    expect(
      photos.filter(
        (row) => row.photoType === 'before' && row.uploadedBy === 'provider',
      ),
    ).toHaveLength(BOOKING_MIN_BEFORE_PHOTOS);
    expect(
      photos.filter(
        (row) => row.photoType === 'after' && row.uploadedBy === 'provider',
      ),
    ).toHaveLength(BOOKING_MIN_AFTER_PHOTOS);
  });

  it('refuse les cas P0 : MIME, clé, KYC, quota photos', async () => {
    const bookingId = await createBooking(8);
    await goToInProgress(bookingId);

    const forbiddenMime = await http()
      .post('/api/v1/media/upload-url')
      .set('Authorization', `Bearer ${tokens.provider}`)
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

    const invalidKey = await http()
      .post('/api/v1/media/confirm')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ fileKey: 'not-a-key.jpg' })
      .expect(400);
    expect((invalidKey.body as ErrorEnvelope).error.code).toBe(
      'MEDIA_FILE_KEY_INVALID',
    );

    const kycUploaded = await http()
      .post('/api/v1/media/upload-url')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ mimeType: 'application/pdf', context: 'kyc_document' })
      .expect(200);
    const kycKey = (kycUploaded.body as Envelope<{ fileKey: string }>).data
      .fileKey;
    const forbiddenKyc = await http()
      .post('/api/v1/media/confirm')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({ fileKey: kycKey })
      .expect(403);
    expect((forbiddenKyc.body as ErrorEnvelope).error.code).toBe('FORBIDDEN');

    await prisma.bookingPhoto.createMany({
      data: [
        {
          bookingId,
          uploadedBy: 'provider',
          photoType: 'before',
          fileUrl: `https://cdn.carservice.test/m07-partial-before.jpg`,
        },
        {
          bookingId,
          uploadedBy: 'provider',
          photoType: 'after',
          fileUrl: `https://cdn.carservice.test/m07-partial-after.jpg`,
        },
      ],
    });
    const incomplete = await http()
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${tokens.provider}`)
      .send({ status: 'completed' })
      .expect(400);
    expect((incomplete.body as ErrorEnvelope).error.code).toBe(
      'BOOKING_PHOTOS_REQUIRED',
    );
  });
});
