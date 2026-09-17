import {
  formatActorTypeFr,
  formatClientName,
  formatPaymentStatusFr,
  isPaymentRefundable,
  parseBookingsSearchQuery,
  parseRefundReason,
  willCancelByAdmin,
} from '../bookings';

describe('parseBookingsSearchQuery', () => {
  it('treats blank as no filter', () => {
    expect(parseBookingsSearchQuery('  ')).toBeUndefined();
  });

  it('trims a reference', () => {
    expect(parseBookingsSearchQuery('  CS-20260917-1A78  ')).toBe(
      'CS-20260917-1A78',
    );
  });
});

describe('parseRefundReason', () => {
  it('allows empty optional reason', () => {
    expect(parseRefundReason('')).toBeUndefined();
  });

  it('rejects too short reasons', () => {
    expect(parseRefundReason('no')).toBeNull();
  });

  it('trims a valid reason', () => {
    expect(parseRefundReason('  Geste commercial  ')).toBe('Geste commercial');
  });
});

describe('isPaymentRefundable', () => {
  it('allows authorized and captured', () => {
    expect(isPaymentRefundable('authorized')).toBe(true);
    expect(isPaymentRefundable('captured')).toBe(true);
  });

  it('blocks refunded, failed and missing payment', () => {
    expect(isPaymentRefundable('refunded')).toBe(false);
    expect(isPaymentRefundable('failed')).toBe(false);
    expect(isPaymentRefundable(null)).toBe(false);
  });
});

describe('willCancelByAdmin', () => {
  it('allows matching and accepted', () => {
    expect(willCancelByAdmin('pending_provider')).toBe(true);
    expect(willCancelByAdmin('accepted')).toBe(true);
  });

  it('blocks in_progress and completed', () => {
    expect(willCancelByAdmin('in_progress')).toBe(false);
    expect(willCancelByAdmin('completed')).toBe(false);
    expect(willCancelByAdmin('disputed')).toBe(false);
  });
});

describe('formatPaymentStatusFr', () => {
  it('maps authorized', () => {
    expect(formatPaymentStatusFr('authorized')).toBe('Pré-autorisé');
  });

  it('shows dash when missing', () => {
    expect(formatPaymentStatusFr(null)).toBe('—');
  });
});

describe('formatActorTypeFr', () => {
  it('maps system', () => {
    expect(formatActorTypeFr('system')).toBe('Système');
  });
});

describe('formatClientName', () => {
  it('joins first and last name', () => {
    expect(
      formatClientName({
        firstName: 'Alice',
        lastName: 'Martin',
        phone: '+33601020304',
      }),
    ).toBe('Alice Martin');
  });

  it('falls back to phone', () => {
    expect(
      formatClientName({
        firstName: null,
        lastName: null,
        phone: '+33601020304',
      }),
    ).toBe('+33601020304');
  });
});
