import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { MediaService, parseMediaFileKey } from '../media.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { S3Service } from '../s3.service';

const bookingId = '77777777-7777-4777-8777-777777777777';
const clientUserId = '11111111-1111-4111-8111-111111111111';
const providerUserId = '88888888-8888-4888-8888-888888888888';
const now = new Date('2026-09-15T10:00:00.000Z');

function buildService(overrides?: {
  storage?: ReturnType<S3Service['storageConfig']>;
  booking?: object | null;
}) {
  const s3 = {
    storageConfig: jest.fn().mockReturnValue(overrides?.storage ?? null),
    getClient: jest.fn().mockReturnValue(null),
  };
  const prisma = {
    booking: {
      findUnique: jest.fn().mockResolvedValue(
        overrides && 'booking' in overrides
          ? overrides.booking
          : {
              id: bookingId,
              client: { userId: clientUserId },
              provider: { userId: providerUserId },
            },
      ),
    },
    bookingPhoto: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async ({ data }) => ({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        bookingId: data.bookingId,
        uploadedBy: data.uploadedBy,
        photoType: data.photoType,
        fileUrl: data.fileUrl,
        createdAt: now,
      })),
    },
  };

  return {
    service: new MediaService(
      s3 as unknown as S3Service,
      prisma as unknown as PrismaService,
    ),
    s3,
    prisma,
  };
}

describe('MediaService.createUploadUrl', () => {
  it('génère une URL mock locale sans clés S3', async () => {
    const { service } = buildService();

    const result = await service.createUploadUrl(
      { sub: clientUserId, role: UserRole.client },
      {
        mimeType: 'image/jpeg',
        context: 'booking_photo',
        bookingId,
        photoType: 'before',
      },
      now,
    );

    expect(result.data.uploadUrl).toMatch(
      /^https:\/\/cdn\.carservice\.test\/mock-upload\//,
    );
    expect(result.data.fileKey).toMatch(
      new RegExp(`^bookings/${bookingId}/before/.+\\.jpg$`),
    );
    expect(result.data.expiresAt).toBe('2026-09-15T10:15:00.000Z');
  });

  it('refuse un document KYC hors rôle provider', async () => {
    const { service } = buildService();

    await expect(
      service.createUploadUrl(
        { sub: clientUserId, role: UserRole.client },
        { mimeType: 'application/pdf', context: 'kyc_document' },
        now,
      ),
    ).rejects.toMatchObject({
      response: { code: 'FORBIDDEN' },
    });
  });

  it('crée une clé KYC pour un prestataire', async () => {
    const { service, prisma } = buildService();

    const result = await service.createUploadUrl(
      { sub: providerUserId, role: UserRole.provider },
      { mimeType: 'application/pdf', context: 'kyc_document' },
      now,
    );

    expect(result.data.fileKey).toMatch(
      new RegExp(`^kyc/${providerUserId}/.+\\.pdf$`),
    );
    expect(prisma.booking.findUnique).not.toHaveBeenCalled();
  });

  it('refuse une photo si le booking est introuvable', async () => {
    const { service } = buildService({ booking: null });

    await expect(
      service.createUploadUrl(
        { sub: clientUserId, role: UserRole.client },
        {
          mimeType: 'image/png',
          context: 'booking_photo',
          bookingId,
          photoType: 'after',
        },
        now,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuse une photo si le pro n’est pas assigné', async () => {
    const { service } = buildService();

    await expect(
      service.createUploadUrl(
        {
          sub: '99999999-9999-4999-8999-999999999999',
          role: UserRole.provider,
        },
        {
          mimeType: 'image/webp',
          context: 'booking_photo',
          bookingId,
          photoType: 'issue',
        },
        now,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('MediaService.confirmUpload', () => {
  const photoKey = `bookings/${bookingId}/before/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`;

  it('persiste une booking_photo en mock local', async () => {
    const { service, prisma } = buildService();

    const result = await service.confirmUpload(
      { sub: clientUserId, role: UserRole.client },
      { fileKey: photoKey },
      now,
    );

    expect(result.data).toMatchObject({
      bookingId,
      photoType: 'before',
      uploadedBy: 'client',
      fileKey: photoKey,
      fileUrl: `https://cdn.carservice.test/${photoKey}`,
    });
    expect(prisma.bookingPhoto.create).toHaveBeenCalledWith({
      data: {
        bookingId,
        uploadedBy: 'client',
        photoType: 'before',
        fileUrl: `https://cdn.carservice.test/${photoKey}`,
      },
    });
  });

  it('est idempotent si fileUrl existe déjà', async () => {
    const { service, prisma } = buildService();
    prisma.bookingPhoto.findFirst.mockResolvedValue({
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      bookingId,
      uploadedBy: 'client',
      photoType: 'before',
      fileUrl: `https://cdn.carservice.test/${photoKey}`,
      createdAt: now,
    });

    await service.confirmUpload(
      { sub: clientUserId, role: UserRole.client },
      { fileKey: photoKey },
      now,
    );
    expect(prisma.bookingPhoto.create).not.toHaveBeenCalled();
  });

  it('refuse une clé fichier invalide', async () => {
    const { service } = buildService();

    await expect(
      service.confirmUpload(
        { sub: clientUserId, role: UserRole.client },
        { fileKey: 'not-a-key.jpg' },
        now,
      ),
    ).rejects.toMatchObject({ response: { code: 'MEDIA_FILE_KEY_INVALID' } });
  });

  it('refuse un HeadObject manquant quand S3 est configuré', async () => {
    const client = { send: jest.fn().mockRejectedValue(new Error('NoSuchKey')) };
    const { service, s3 } = buildService({
      storage: {
        endpoint: 'https://s3.fr-par.scw.cloud',
        bucket: 'carservice-dev-media',
        region: 'fr-par',
        accessKeyId: 'scw_local_access',
        secretAccessKey: 'scw_local_secret_key',
        forcePathStyle: true,
      },
    });
    s3.getClient.mockReturnValue(client);

    await expect(
      service.confirmUpload(
        { sub: clientUserId, role: UserRole.client },
        { fileKey: photoKey },
        now,
      ),
    ).rejects.toMatchObject({ response: { code: 'MEDIA_OBJECT_NOT_FOUND' } });
  });

  it('persiste une URL path-style si HeadObject réussit', async () => {
    const client = { send: jest.fn().mockResolvedValue({}) };
    const { service, s3, prisma } = buildService({
      storage: {
        endpoint: 'https://s3.fr-par.scw.cloud',
        bucket: 'carservice-dev-media',
        region: 'fr-par',
        accessKeyId: 'scw_local_access',
        secretAccessKey: 'scw_local_secret_key',
        forcePathStyle: true,
      },
    });
    s3.getClient.mockReturnValue(client);

    const result = await service.confirmUpload(
      { sub: clientUserId, role: UserRole.client },
      { fileKey: photoKey },
      now,
    );

    expect(client.send).toHaveBeenCalled();
    expect(result.data.fileUrl).toBe(
      `https://s3.fr-par.scw.cloud/carservice-dev-media/${photoKey}`,
    );
    expect(prisma.bookingPhoto.create).toHaveBeenCalled();
  });

  it('mappe un admin vers uploadedBy provider', async () => {
    const { service, prisma } = buildService();

    await service.confirmUpload(
      {
        sub: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: UserRole.admin,
      },
      { fileKey: photoKey },
      now,
    );

    expect(prisma.bookingPhoto.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ uploadedBy: 'provider' }),
    });
  });

  it('confirme un KYC sans écrire booking_photos', async () => {
    const kycKey = `kyc/${providerUserId}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.pdf`;
    const { service, prisma } = buildService();

    const result = await service.confirmUpload(
      { sub: providerUserId, role: UserRole.provider },
      { fileKey: kycKey },
      now,
    );

    expect(result.data).toMatchObject({
      id: null,
      bookingId: null,
      photoType: null,
      uploadedBy: 'provider',
      fileKey: kycKey,
    });
    expect(prisma.bookingPhoto.create).not.toHaveBeenCalled();
  });

  it('refuse un KYC dont la clé n’appartient pas au prestataire', async () => {
    const kycKey = `kyc/${providerUserId}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.pdf`;
    const { service } = buildService();

    await expect(
      service.confirmUpload(
        {
          sub: '99999999-9999-4999-8999-999999999999',
          role: UserRole.provider,
        },
        { fileKey: kycKey },
        now,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('parseMediaFileKey', () => {
  it('parse une clé photo de mission', () => {
    expect(
      parseMediaFileKey(
        `bookings/${bookingId}/after/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp`,
      ),
    ).toEqual({
      context: 'booking_photo',
      bookingId,
      photoType: 'after',
    });
  });

  it('refuse un PDF en photo de mission', () => {
    expect(
      parseMediaFileKey(
        `bookings/${bookingId}/before/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.pdf`,
      ),
    ).toBeNull();
  });
});
