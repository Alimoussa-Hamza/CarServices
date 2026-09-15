import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  MEDIA_UPLOAD_TTL_SECONDS,
  type BookingPhotoType,
  type ConfirmMediaUploadDto,
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

const UUID =
  '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
const BOOKING_KEY = new RegExp(
  `^bookings/(${UUID})/(before|after|issue)/(${UUID})\\.(jpg|png|webp)$`,
);
const KYC_KEY = new RegExp(`^kyc/(${UUID})/(${UUID})\\.(jpg|png|webp|pdf)$`);

export type ParsedMediaFileKey =
  | {
      context: 'booking_photo';
      bookingId: string;
      photoType: BookingPhotoType;
    }
  | {
      context: 'kyc_document';
      userId: string;
    };

export function parseMediaFileKey(fileKey: string): ParsedMediaFileKey | null {
  const booking = BOOKING_KEY.exec(fileKey);
  if (booking) {
    return {
      context: 'booking_photo',
      bookingId: booking[1] ?? '',
      photoType: booking[2] as BookingPhotoType,
    };
  }

  const kyc = KYC_KEY.exec(fileKey);
  if (kyc) {
    return {
      context: 'kyc_document',
      userId: kyc[1] ?? '',
    };
  }

  return null;
}

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

  async confirmUpload(
    user: AuthPayload,
    dto: ConfirmMediaUploadDto,
    now = new Date(),
  ) {
    const parsed = parseMediaFileKey(dto.fileKey);
    if (!parsed) {
      throw new BadRequestException({
        code: 'MEDIA_FILE_KEY_INVALID',
        message: 'Clé fichier média invalide.',
        details: [],
      });
    }

    if (parsed.context === 'kyc_document') {
      if (user.role !== UserRole.provider || parsed.userId !== user.sub) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: "Vous n'êtes pas autorisé à confirmer ce document KYC.",
          details: [],
        });
      }
    } else {
      await this.assertCanUploadBookingPhoto(user, parsed.bookingId);
    }

    await this.assertObjectExists(dto.fileKey);
    const fileUrl = this.publicFileUrl(dto.fileKey);

    if (parsed.context === 'kyc_document') {
      return {
        data: {
          id: null,
          bookingId: null,
          photoType: null,
          uploadedBy: 'provider' as const,
          fileKey: dto.fileKey,
          fileUrl,
          createdAt: now.toISOString(),
        },
      };
    }

    const existing = await this.prisma.bookingPhoto.findFirst({
      where: { fileUrl },
    });
    const photo =
      existing ??
      (await this.prisma.bookingPhoto.create({
        data: {
          bookingId: parsed.bookingId,
          uploadedBy: user.role === UserRole.client ? 'client' : 'provider',
          photoType: parsed.photoType,
          fileUrl,
        },
      }));

    return {
      data: {
        id: photo.id,
        bookingId: photo.bookingId,
        photoType: photo.photoType,
        uploadedBy: photo.uploadedBy,
        fileKey: dto.fileKey,
        fileUrl: photo.fileUrl,
        createdAt: photo.createdAt.toISOString(),
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

  private async assertObjectExists(fileKey: string) {
    const storage = this.s3.storageConfig();
    const client = this.s3.getClient();
    if (!storage || !client) {
      return;
    }

    try {
      await client.send(
        new HeadObjectCommand({ Bucket: storage.bucket, Key: fileKey }),
      );
    } catch {
      throw new BadRequestException({
        code: 'MEDIA_OBJECT_NOT_FOUND',
        message: "Le fichier n'a pas été trouvé sur le stockage.",
        details: [],
      });
    }
  }

  private publicFileUrl(fileKey: string): string {
    const storage = this.s3.storageConfig();
    if (!storage) {
      return `https://cdn.carservice.test/${fileKey}`;
    }

    const base = storage.endpoint.replace(/\/$/, '');
    if (storage.forcePathStyle) {
      return `${base}/${storage.bucket}/${fileKey}`;
    }

    const host = new URL(base);
    return `${host.protocol}//${storage.bucket}.${host.host}/${fileKey}`;
  }
}
