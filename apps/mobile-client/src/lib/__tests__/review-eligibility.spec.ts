import {
  canLeaveReview,
  completedAtFromTimeline,
  REVIEW_WINDOW_HOURS,
} from '../review-eligibility';

describe('review-eligibility', () => {
  it('autorise un avis completed dans la fenêtre 72h', () => {
    const now = new Date('2026-09-16T12:00:00.000Z');
    expect(
      canLeaveReview({
        status: 'completed',
        completedAtIso: '2026-09-15T11:30:00.000Z',
        now,
      }),
    ).toBe(true);
  });

  it('refuse hors fenêtre ou statut non completed', () => {
    const now = new Date('2026-09-20T12:00:00.000Z');
    expect(
      canLeaveReview({
        status: 'completed',
        completedAtIso: '2026-09-15T11:30:00.000Z',
        now,
      }),
    ).toBe(false);
    expect(
      canLeaveReview({
        status: 'accepted',
        completedAtIso: '2026-09-15T11:30:00.000Z',
        now,
      }),
    ).toBe(false);
  });

  it('extrait completedAt depuis la timeline', () => {
    expect(
      completedAtFromTimeline([
        { toStatus: 'accepted', createdAt: '2026-09-14T18:20:00.000Z' },
        { toStatus: 'completed', createdAt: '2026-09-15T11:30:00.000Z' },
      ]),
    ).toBe('2026-09-15T11:30:00.000Z');
  });

  it('expose 72h', () => {
    expect(REVIEW_WINDOW_HOURS).toBe(72);
  });
});
