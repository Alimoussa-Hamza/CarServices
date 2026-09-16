import {
  createReview,
  resetMockReviewsForTests,
} from '../reviews';
import { MOCK_BOOKING_COMPLETED_ID, MOCK_BOOKING_ID } from '../../mocks/booking-details';

describe('createReview (mock)', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    resetMockReviewsForTests();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  it('crée un avis sur booking completed', async () => {
    const res = await createReview({
      bookingId: MOCK_BOOKING_COMPLETED_ID,
      rating: 5,
      comment: 'Impeccable',
      tags: ['quality', 'punctuality'],
    });
    expect(res.rating).toBe(5);
    expect(res.tags).toEqual(['quality', 'punctuality']);
    expect(res.provider.ratingCount).toBe(1);
  });

  it('refuse un booking non completed', async () => {
    await expect(
      createReview({
        bookingId: MOCK_BOOKING_ID,
        rating: 4,
        tags: [],
      }),
    ).rejects.toMatchObject({ code: 'REVIEW_BOOKING_NOT_COMPLETED' });
  });

  it('refuse un doublon', async () => {
    await createReview({
      bookingId: MOCK_BOOKING_COMPLETED_ID,
      rating: 5,
      tags: [],
    });
    await expect(
      createReview({
        bookingId: MOCK_BOOKING_COMPLETED_ID,
        rating: 4,
        tags: [],
      }),
    ).rejects.toMatchObject({ code: 'REVIEW_ALREADY_EXISTS' });
  });
});
