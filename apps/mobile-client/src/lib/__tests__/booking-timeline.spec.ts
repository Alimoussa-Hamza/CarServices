import type { BookingStatus, BookingTimelineEvent } from '@carservice/shared-types';
import {
  buildClientTimeline,
  canRevealFullAddress,
  canShowCancelCta,
  isTerminalUnassigned,
  resolveTimelineProgress,
} from '../booking-timeline';

describe('booking-timeline', () => {
  it('pending_provider : Confirmé done, recherche current', () => {
    const progress = resolveTimelineProgress('pending_provider');
    expect(progress).toEqual({ doneThrough: 0, currentIndex: 1 });

    const steps = buildClientTimeline('pending_provider');
    expect(steps[0]?.state).toBe('done');
    expect(steps[1]?.state).toBe('current');
    expect(steps[1]?.label).toContain('Recherche');
    expect(steps[2]?.state).toBe('upcoming');
  });

  it('accepted : pro confirmé done, pas de current', () => {
    const steps = buildClientTimeline('accepted');
    expect(steps[1]?.state).toBe('done');
    expect(steps[1]?.label).toBe('Pro confirmé');
    expect(steps.every((s) => s.state !== 'current')).toBe(true);
  });

  it('attache les horodatages timeline API', () => {
    const events: BookingTimelineEvent[] = [
      {
        fromStatus: null,
        toStatus: 'payment_authorized',
        actorType: 'system',
        reason: null,
        createdAt: '2026-09-16T18:00:00.000Z',
      },
      {
        fromStatus: 'pending_provider',
        toStatus: 'accepted',
        actorType: 'provider',
        reason: null,
        createdAt: '2026-09-16T18:12:00.000Z',
      },
    ];
    const steps = buildClientTimeline('accepted', events);
    expect(steps[0]?.at).toBe('2026-09-16T18:00:00.000Z');
    expect(steps[1]?.at).toBe('2026-09-16T18:12:00.000Z');
  });

  it('révèle adresse après acceptation seulement', () => {
    expect(canRevealFullAddress('pending_provider')).toBe(false);
    expect(canRevealFullAddress('accepted')).toBe(true);
    expect(canRevealFullAddress('en_route')).toBe(true);
  });

  it('CTA annuler si > 24h et statut annulable', () => {
    const slot = '2026-09-20T09:00:00.000Z';
    const now = new Date('2026-09-16T12:00:00.000Z');
    expect(canShowCancelCta('pending_provider', slot, now)).toBe(true);
    expect(canShowCancelCta('in_progress', slot, now)).toBe(false);

    const late = new Date('2026-09-20T08:00:00.000Z');
    expect(canShowCancelCta('pending_provider', slot, late)).toBe(false);
  });

  it('détecte unassigned / expired', () => {
    expect(isTerminalUnassigned('unassigned')).toBe(true);
    expect(isTerminalUnassigned('expired')).toBe(true);
    expect(isTerminalUnassigned('pending_provider' as BookingStatus)).toBe(false);
  });
});
