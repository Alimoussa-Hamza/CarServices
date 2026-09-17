import {
  formatKycDocType,
  formatWashMethods,
  isImageDocumentUrl,
  parseKycRejectReason,
} from '../kyc';

describe('formatKycDocType', () => {
  it('maps rc_pro', () => {
    expect(formatKycDocType('rc_pro')).toBe('RC Pro');
  });
});

describe('formatWashMethods', () => {
  it('joins known methods', () => {
    expect(formatWashMethods(['waterless', 'steam'])).toBe('Sans eau, Vapeur');
  });

  it('shows dash when empty', () => {
    expect(formatWashMethods([])).toBe('—');
  });
});

describe('parseKycRejectReason', () => {
  it('rejects too short reasons', () => {
    expect(parseKycRejectReason('non')).toBeNull();
  });

  it('trims a valid reason', () => {
    expect(parseKycRejectReason('  RC Pro illisible  ')).toBe('RC Pro illisible');
  });
});

describe('isImageDocumentUrl', () => {
  it('detects jpeg paths', () => {
    expect(isImageDocumentUrl('https://cdn.example/id.jpg')).toBe(true);
  });

  it('treats pdf as non-image', () => {
    expect(isImageDocumentUrl('https://cdn.example/rc.pdf')).toBe(false);
  });
});
