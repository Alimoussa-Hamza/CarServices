import { UserRole } from '@prisma/client';
import { ReviewsController } from '../reviews.controller';
import { ReviewsService } from '../reviews.service';

describe('ReviewsController', () => {
  it('délègue POST /reviews au service', async () => {
    const reviews = {
      create: jest.fn().mockResolvedValue({
        data: { id: 'review-1', rating: 5 },
      }),
    };
    const controller = new ReviewsController(
      reviews as unknown as ReviewsService,
    );
    const user = {
      sub: '11111111-1111-4111-8111-111111111111',
      role: UserRole.client,
    };
    const dto = {
      bookingId: '77777777-7777-4777-8777-777777777777',
      rating: 5 as const,
      tags: ['quality'] as const,
    };

    await expect(
      controller.create(user, { ...dto, tags: [...dto.tags] }),
    ).resolves.toMatchObject({
      data: { id: 'review-1' },
    });
    expect(reviews.create).toHaveBeenCalledWith(user, {
      ...dto,
      tags: [...dto.tags],
    });
  });
});
