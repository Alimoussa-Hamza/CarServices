import {
  formatDisputeReasonFr,
  formatOpenedByFr,
  formatPaymentActionFr,
  isOpenDispute,
  parseResolveNotes,
  statusesFromFilter,
} from '../disputes';

describe('statusesFromFilter', () => {
  it('omits status for the open queue', () => {
    expect(statusesFromFilter('')).toBeUndefined();
  });

  it('expands resolved', () => {
    expect(statusesFromFilter('resolved')).toEqual([
      'resolved_client',
      'resolved_provider',
      'resolved_split',
      'closed',
    ]);
  });

  it('keeps a single status', () => {
    expect(statusesFromFilter('open')).toEqual(['open']);
  });
});

describe('isOpenDispute', () => {
  it('allows open and under_review', () => {
    expect(isOpenDispute('open')).toBe(true);
    expect(isOpenDispute('under_review')).toBe(true);
  });

  it('blocks resolved', () => {
    expect(isOpenDispute('resolved_client')).toBe(false);
  });
});

describe('parseResolveNotes', () => {
  it('allows empty when optional', () => {
    expect(parseResolveNotes('  ', false)).toBeUndefined();
  });

  it('requires notes for split', () => {
    expect(parseResolveNotes('', true)).toBeNull();
  });

  it('rejects too short notes', () => {
    expect(parseResolveNotes('ok', false)).toBeNull();
  });

  it('trims a valid note', () => {
    expect(parseResolveNotes('  Remboursement intégral  ', false)).toBe(
      'Remboursement intégral',
    );
  });
});

describe('formatDisputeReasonFr', () => {
  it('maps quality', () => {
    expect(formatDisputeReasonFr('quality')).toBe('Qualité');
  });
});

describe('formatOpenedByFr', () => {
  it('maps client', () => {
    expect(formatOpenedByFr('client')).toBe('Client');
  });
});

describe('formatPaymentActionFr', () => {
  it('maps unfrozen', () => {
    expect(formatPaymentActionFr('unfrozen')).toBe('payout dégelé');
  });
});
