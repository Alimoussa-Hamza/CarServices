import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  MEDIA_UPLOAD_TTL_SECONDS,
  type CreateMediaUploadUrlDto,
} from '@carservice/shared-types';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuthPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from './s3.service';

const MIME_EXTENSION: Record<CreateMediaUploadUrlDto['mimeType'], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

@Injectable()
export class MediaService {
  constructor(
    private readonly s3: S3Service,
    private readonly prisma: PrismaService,
  ) {}

  async createUploadUrl(
    user: AuthPayload,
    dto: CreateMediaUploadUrlDto,
    now = new Date(),
  ) {
    if (dto.context === 'kyc_document' && user.role !== UserRole.provider) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Seuls les prestataires peuvent uploader un document KYC.',
        details: [],
      });
    }

    if (dto.context === 'booking_photo' && dto.bookingId && dto.photoType) {
      await this.assertCanUploadBookingPhoto(user, dto.bookingId);
    }

    const fileKey = this.buildFileKey(user.sub, dto);
    const expiresAt = new Date(
      now.getTime() + MEDIA_UPLOAD_TTL_SECONDS * 1000,
    ).toISOString();
    const uploadUrl = await this.signUploadUrl(fileKey, dto.mimeType);

    return {
      data: {
        uploadUrl,
        fileKey,
        expiresAt,
      },
    };
  }

  private async assertCanUploadBookingPhoto(
    user: AuthPayload,
    bookingId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { select: { userId: true } },
        provider: { select: { userId: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Réservation introuvable.',
        details: [],
      });
    }

    if (user.role === UserRole.admin) {
      return;
    }

    const isClient =
      user.role === UserRole.client && booking.client.userId === user.sub;
    const isAssignedProvider =
      user.role === UserRole.provider &&
      booking.provider?.userId === user.sub;

    if (!isClient && !isAssignedProvider) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: "Vous n'êtes pas autorisé à uploader sur cette mission.",
        details: [],
      });
    }
  }

  private buildFileKey(userId: string, dto: CreateMediaUploadUrlDto): string {
    const id = randomUUID();
    const ext = MIME_EXTENSION[dto.mimeType];

    if (dto.context === 'booking_photo' && dto.bookingId && dto.photoType) {
      return `bookings/${dto.bookingId}/${dto.photoType}/${id}.${ext}`;
    }

    return `kyc/${userId}/${id}.${ext}`;
  }

  private async signUploadUrl(fileKey: string, mimeType: string) {
    const storage = this.s3.storageConfig();
    const client = this.s3.getClient();
    if (!storage || !client) {
      return `https://cdn.carservice.test/mock-upload/${encodeURIComponent(fileKey)}`;
    }

    return getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: storage.bucket,
        Key: fileKey,
        ContentType: mimeType,
      }),
      { expiresIn: MEDIA_UPLOAD_TTL_SECONDS },
    );
  }
}
