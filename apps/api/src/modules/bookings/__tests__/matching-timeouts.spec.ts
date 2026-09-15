import { matchingJobId } from '../matching-queue.service';
import { computeMatchingJobDelays } from '../matching-timeouts';

describe('computeMatchingJobDelays', () => {
  const now = new Date('2026-09-13T10:00:00.000Z');

  it('T1 = 30 min et T2 = 2 h si le créneau est loin (RG-MATCH-04/05)', () => {
    const slotStart = new Date('2026-09-20T10:00:00.000Z');
    expect(computeMatchingJobDelays(now, slotStart)).toEqual({
      t1Ms: 30 * 60 * 1000,
      t2Ms: 2 * 60 * 60 * 1000,
    });
  });

  it('T2 = H-2 du créneau s’il arrive avant les 2 h', () => {
    const slotStart = new Date('2026-09-13T13:00:00.000Z');
    expect(computeMatchingJobDelays(now, slotStart).t2Ms).toBe(60 * 60 * 1000);
  });

  it('T2 immédiat si le créneau est à moins de 2 h', () => {
    const slotStart = new Date('2026-09-13T11:00:00.000Z');
    expect(computeMatchingJobDelays(now, slotStart).t2Ms).toBe(0);
  });
});

describe('matchingJobId', () => {
  it('n’utilise pas « : » (interdit par BullMQ 6)', () => {
    const id = matchingJobId(
      'expand-radius',
      '77777777-7777-4777-8777-777777777777',
    );
    expect(id).not.toContain(':');
    expect(id).toContain('expand-radius_');
  });
});
