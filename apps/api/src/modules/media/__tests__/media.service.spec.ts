import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { MediaService } from '../media.service';
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
