import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CreateReviewDto, ReviewTag } from '@carservice/shared-types';
import { AuthPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

export function computeProviderRating(ratings: number[]): {
  ratingAvg: number;
  ratingCount: number;
} {
  if (ratings.length === 0) {
    return { ratingAvg: 0, ratingCount: 0 };
  }

  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return {
    ratingAvg: Math.round((sum / ratings.length) * 100) / 100,
    ratingCount: ratings.length,
  };
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthPayload, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { client: { select: { id: true, userId: true } } },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Réservation introuvable.',
        details: [],
      });
    }

    if (booking.client.userId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: "Vous n'êtes pas autorisé à noter cette mission.",
        details: [],
      });
    }

    if (booking.status !== 'completed') {
      throw new BadRequestException({
        code: 'REVIEW_BOOKING_NOT_COMPLETED',
        message: 'Seules les missions terminées peuvent être notées.',
        details: [],
      });
    }

    const providerId = booking.providerId;
    if (!providerId) {
      throw new ConflictException({
        code: 'BOOKING_NOT_ASSIGNED',
        message: 'Aucun prestataire assigné à cette mission.',
        details: [],
      });
    }

    const existing = await this.prisma.review.findUnique({
      where: { bookingId: booking.id },
    });
    if (existing) {
      throw new ConflictException({
        code: 'REVIEW_ALREADY_EXISTS',
        message: 'Un avis a déjà été déposé pour cette mission.',
        details: [],
      });
    }

    try {
      const review = await this.prisma.$transaction(async (tx) => {
        const created = await tx.review.create({
          data: {
            bookingId: booking.id,
            clientId: booking.clientId,
            providerId,
            rating: dto.rating,
            comment: dto.comment || null,
            tags: dto.tags,
          },
        });

        const visible = await tx.review.findMany({
          where: { providerId, isHidden: false },
          select: { rating: true },
        });
        const { ratingAvg, ratingCount } = computeProviderRating(
          visible.map((row) => row.rating),
        );

        await tx.providerProfile.update({
          where: { id: providerId },
          data: {
            ratingAvg: new Prisma.Decimal(ratingAvg.toFixed(2)),
            ratingCount,
          },
        });

        return { created, ratingAvg, ratingCount };
      });

      return {
        data: {
          id: review.created.id,
          bookingId: review.created.bookingId,
          rating: review.created.rating,
          comment: review.created.comment,
          tags: review.created.tags as ReviewTag[],
          createdAt: review.created.createdAt.toISOString(),
          provider: {
            ratingAvg: review.ratingAvg,
            ratingCount: review.ratingCount,
          },
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'REVIEW_ALREADY_EXISTS',
          message: 'Un avis a déjà été déposé pour cette mission.',
          details: [],
        });
      }
      throw error;
    }
  }
}
