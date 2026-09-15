import {
  clientCancelFeeCents,
  hoursUntilSlot,
  providerCancelPenalty,
  resolveCancelWindow,
} from '../booking-cancel';

describe('booking-cancel', () => {
  const now = new Date('2026-09-13T10:00:00.000Z');

  it('classe free / mid / late selon le délai (RG-CANCEL)', () => {
    expect(resolveCancelWindow(hoursUntilSlot(new Date('2026-09-20T10:00:00.000Z'), now))).toBe(
      'free',
    );
    expect(resolveCancelWindow(hoursUntilSlot(new Date('2026-09-13T20:00:00.000Z'), now))).toBe(
      'mid',
    );
    expect(resolveCancelWindow(hoursUntilSlot(new Date('2026-09-13T11:00:00.000Z'), now))).toBe(
      'late',
    );
  });

  it('calcule les frais client 0 / 20 % / 50 %', () => {
    expect(clientCancelFeeCents(10000, 'free')).toBe(0);
    expect(clientCancelFeeCents(10000, 'mid')).toBe(2000);
    expect(clientCancelFeeCents(10000, 'late')).toBe(5000);
  });

  it('pénalise le pro en mid/late seulement', () => {
    expect(providerCancelPenalty('free')).toBe(0);
    expect(providerCancelPenalty('mid')).toBe(2);
    expect(providerCancelPenalty('late')).toBe(5);
  });
});
