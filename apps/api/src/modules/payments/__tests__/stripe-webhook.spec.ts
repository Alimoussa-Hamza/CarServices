import { createHmac } from 'crypto';
import {
  parseStripeSignatureHeader,
  STRIPE_SIGNATURE_TOLERANCE_SECONDS,
  verifyStripeWebhookSignature,
} from '../stripe-webhook';

const secret = 'whsec_mocklocalkey16chars';
const payload = '{"id":"evt_mock_1","type":"payment_intent.succeeded"}';
const timestamp = 1_747_000_000;

function signedHeader(at = timestamp) {
  const digest = createHmac('sha256', secret)
    .update(`${at}.${payload}`, 'utf8')
    .digest('hex');
  return `t=${at},v1=${digest}`;
}

describe('verifyStripeWebhookSignature', () => {
  const now = new Date(timestamp * 1000);

  it('accepte une signature v1 valide', () => {
    expect(
      verifyStripeWebhookSignature({
        payload,
        header: signedHeader(),
        secret,
        now,
      }),
    ).toBe(true);
  });

  it('refuse un HMAC altéré', () => {
    expect(
      verifyStripeWebhookSignature({
        payload,
        header: `t=${timestamp},v1=${'ab'.repeat(32)}`,
        secret,
        now,
      }),
    ).toBe(false);
  });

  it('refuse un timestamp hors tolérance', () => {
    const stale = timestamp - STRIPE_SIGNATURE_TOLERANCE_SECONDS - 1;
    expect(
      verifyStripeWebhookSignature({
        payload,
        header: signedHeader(stale),
        secret,
        now,
      }),
    ).toBe(false);
  });

  it('parse t et v1 depuis le header Stripe', () => {
    expect(parseStripeSignatureHeader(signedHeader())).toEqual({
      timestamp,
      signatures: [expect.any(String)],
    });
    expect(parseStripeSignatureHeader('invalid')).toBeNull();
  });
});
