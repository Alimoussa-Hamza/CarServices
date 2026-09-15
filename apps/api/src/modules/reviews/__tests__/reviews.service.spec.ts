import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { computeProviderRating, ReviewsService } from '../reviews.service';

const bookingId = '77777777-7777-4777-8777-777777777777';
const clientUserId = '11111111-1111-4111-8111-111111111111';
const clientId = '22222222-2222-4222-8222-222222222222';
const providerId = '33333333-3333-4333-8333-333333333333';
const now = new Date('2026-09-15T21:00:00.000Z');

function buildService(booking?: object | null) {
  const created = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    bookingId,
    rating: 5,
    comment: 'Impeccable',
    tags: ['quality', 'punctuality'],
    createdAt: now,
  };
  const prisma = {
    booking: {
      findUnique: jest.fn().mockResolvedValue(
        booking === undefined
          ? {
              id: bookingId,
              status: 'completed',
              clientId,
              providerId,
              client: { id: clientId, userId: clientUserId },
            }
          : booking,
      ),
    },
    review: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(created),
      findMany: jest.fn().mockResolvedValue([{ rating: 5 }]),
    },
    providerProfile: {
      update: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
  );

  return {
    service: new ReviewsService(prisma as unknown as PrismaService),
    prisma,
    created,
  };
}

describe('computeProviderRating', () => {
  it('retourne 0 sans avis', () => {
    expect(computeProviderRating([])).toEqual({ ratingAvg: 0, ratingCount: 0 });
  });

  it('calcule la moyenne arrondie à 2 décimales (RG-QUAL-02)', () => {
    expect(computeProviderRating([5, 4, 4])).toEqual({
      ratingAvg: 4.33,
      ratingCount: 3,
    });
  });
});

describe('ReviewsService.create', () => {
  const user = { sub: clientUserId, role: UserRole.client };
  const dto = {
    bookingId,
    rating: 5 as const,
    comment: 'Impeccable',
    tags: ['quality', 'punctuality'] as const,
  };

  it('crée un avis et met à jour rating_avg / rating_count', async () => {
    const { service, prisma } = buildService();

    const result = await service.create(user, { ...dto, tags: [...dto.tags] });

    expect(result.data).toMatchObject({
      bookingId,
      rating: 5,
      comment: 'Impeccable',
      tags: ['quality', 'punctuality'],
      provider: { ratingAvg: 5, ratingCount: 1 },
    });
    expect(prisma.review.create).toHaveBeenCalled();
    expect(prisma.providerProfile.update).toHaveBeenCalledWith({
      where: { id: providerId },
      data: expect.objectContaining({ ratingCount: 1 }),
    });
  });

  it('refuse un booking introuvable', async () => {
    const { service } = buildService(null);

    await expect(
      service.create(user, { ...dto, tags: [...dto.tags] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuse un client non propriétaire', async () => {
    const { service } = buildService();

    await expect(
      service.create(
        { sub: '99999999-9999-4999-8999-999999999999', role: UserRole.client },
        { ...dto, tags: [...dto.tags] },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuse une mission non completed (RG-QUAL-04)', async () => {
    const { service } = buildService({
      id: bookingId,
      status: 'in_progress',
      clientId,
      providerId,
      client: { id: clientId, userId: clientUserId },
    });

    await expect(
      service.create(user, { ...dto, tags: [...dto.tags] }),
    ).rejects.toMatchObject({
      response: { code: 'REVIEW_BOOKING_NOT_COMPLETED' },
    });
    await expect(
      service.create(user, { ...dto, tags: [...dto.tags] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse un second avis sur le même booking', async () => {
    const { service, prisma } = buildService();
    prisma.review.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create(user, { ...dto, tags: [...dto.tags] }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
