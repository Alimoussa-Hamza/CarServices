import type { CreatedReview, CreateReviewDto, ReviewTag } from '@carservice/shared-types';
import { api, ApiError } from '@carservice/api-client';
import { env, parseUseMocks } from '../config/env';
import { bootstrapApiClient } from './api-bootstrap';
import { getMockBookingDetail } from '../mocks/booking-details';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

const submitted = new Set<string>();

export function resetMockReviewsForTests(): void {
  submitted.clear();
}

export function buildMockCreatedReview(dto: CreateReviewDto): CreatedReview {
  return {
    id: 'f1111111-1111-4111-8111-111111111601',
    bookingId: dto.bookingId,
    rating: dto.rating,
    comment: dto.comment?.trim() ? dto.comment.trim() : null,
    tags: dto.tags ?? [],
    createdAt: new Date().toISOString(),
    provider: {
      ratingAvg: dto.rating,
      ratingCount: 1,
    },
  };
}

export async function createReview(dto: CreateReviewDto): Promise<CreatedReview> {
  if (useMocksNow()) {
    const detail = getMockBookingDetail(dto.bookingId);
    if (!detail) {
      throw new ApiError('BOOKING_NOT_FOUND', 'Réservation introuvable.', 404);
    }
    if (detail.status !== 'completed') {
      throw new ApiError(
        'REVIEW_BOOKING_NOT_COMPLETED',
        'Avis possible uniquement après une mission terminée.',
        400,
      );
    }
    if (submitted.has(dto.bookingId)) {
      throw new ApiError('REVIEW_ALREADY_EXISTS', 'Tu as déjà laissé un avis.', 409);
    }
    if (dto.rating < 1 || dto.rating > 5) {
      throw new ApiError('VALIDATION_ERROR', 'Note invalide.', 400);
    }
    submitted.add(dto.bookingId);
    return buildMockCreatedReview({
      ...dto,
      tags: dto.tags ?? [],
    });
  }

  bootstrapApiClient();
  return api.reviews.create(dto);
}

export type { ReviewTag, CreateReviewDto, CreatedReview };
