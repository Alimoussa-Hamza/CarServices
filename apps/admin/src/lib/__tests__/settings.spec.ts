import {
  diffConfigPatch,
  formatCommissionPercent,
  formValuesFromConfig,
  parseBoundedInt,
  parseCommissionPercent,
  parseServiceFeeCents,
  parseSettingsForm,
} from '../settings';

const SAMPLE = {
  commissionRate: 0.2,
  matchingTimeoutT1Minutes: 30,
  matchingTimeoutT2Hours: 2,
  matchingUnassignedLeadHours: 2,
  cancelFreeHours: 24,
  cancelLateHours: 2,
  serviceFeeCents: 0,
  updatedAt: null,
};

describe('formatCommissionPercent', () => {
  it('formats 20 %', () => {
    expect(formatCommissionPercent(0.2)).toBe('20');
  });

  it('keeps one decimal', () => {
    expect(formatCommissionPercent(0.225)).toBe('22,5');
  });
});

describe('parseCommissionPercent', () => {
  it('parses 22,5 %', () => {
    expect(parseCommissionPercent('22,5')).toBe(0.225);
  });

  it('rejects 0 and 100', () => {
    expect(parseCommissionPercent('0')).toBeNull();
    expect(parseCommissionPercent('100')).toBeNull();
  });
});

describe('parseBoundedInt', () => {
  it('allows T1 45', () => {
    expect(parseBoundedInt('45', 1, 240)).toBe(45);
  });

  it('rejects above max', () => {
    expect(parseBoundedInt('300', 1, 240)).toBeNull();
  });
});

describe('parseServiceFeeCents', () => {
  it('parses euros', () => {
    expect(parseServiceFeeCents('2,50')).toBe(250);
  });

  it('rejects above 100 €', () => {
    expect(parseServiceFeeCents('101')).toBeNull();
  });
});

describe('parseSettingsForm / diffConfigPatch', () => {
  it('builds a T1-only patch', () => {
    const parsed = parseSettingsForm({
      ...formValuesFromConfig(SAMPLE),
      matchingTimeoutT1Minutes: '45',
    });
    expect(parsed).not.toBeNull();
    expect(diffConfigPatch(SAMPLE, parsed!)).toEqual({
      matchingTimeoutT1Minutes: 45,
    });
  });

  it('returns null when nothing changed', () => {
    const parsed = parseSettingsForm(formValuesFromConfig(SAMPLE));
    expect(parsed).not.toBeNull();
    expect(diffConfigPatch(SAMPLE, parsed!)).toBeNull();
  });

  it('rejects invalid commission', () => {
    expect(
      parseSettingsForm({
        ...formValuesFromConfig(SAMPLE),
        commissionPercent: '0',
      }),
    ).toBeNull();
  });
});
