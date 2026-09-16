import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Checkbox } from '../../src/components/ui/checkbox';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { StickyCta } from '../../src/components/ui/sticky-cta';
import { env } from '../../src/config/env';
import { createBooking } from '../../src/data/checkout';
import { mapApiError } from '../../src/lib/api-errors';
import { formatPriceEur, formatSlotFr } from '../../src/lib/format';
import { runCheckoutPayment } from '../../src/lib/payment-sheet';
import { useBookingDraftStore } from '../../src/stores/booking-draft.store';
import { useTheme } from '../../src/theme/theme-provider';

/** C08 Récapitulatif & paiement — CS-M11-S05 */
export default function PayScreen() {
  const { colors, spacing, typography } = useTheme();
  const offerId = useBookingDraftStore((s) => s.offerId);
  const offerName = useBookingDraftStore((s) => s.offerName);
  const vehicleType = useBookingDraftStore((s) => s.vehicleType);
  const optionIds = useBookingDraftStore((s) => s.optionIds);
  const quote = useBookingDraftStore((s) => s.quote);
  const address = useBookingDraftStore((s) => s.address);
  const slotStart = useBookingDraftStore((s) => s.slotStart);
  const slotEnd = useBookingDraftStore((s) => s.slotEnd);
  const reset = useBookingDraftStore((s) => s.reset);

  const [acceptCgv, setAcceptCgv] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalLabel = useMemo(() => {
    if (!quote) {
      return null;
    }
    return formatPriceEur(quote.breakdown.totalCents);
  }, [quote]);

  const onPay = async () => {
    setError(null);
    if (!acceptCgv) {
      setError('Accepte les CGV pour payer.');
      return;
    }
    if (!offerId || !address?.addressId || !slotStart || !slotEnd || !quote) {
      setError('Parcours incomplet. Reprends la réservation.');
      return;
    }

    setLoading(true);
    try {
      const created = await createBooking(
        {
          offerId,
          vehicleType,
          optionIds,
          addressId: address.addressId,
          slotStart,
        },
        {
          pricing: quote.breakdown,
          slotEnd,
          durationMinutes: quote.durationMinutes,
        },
      );

      const paymentResult = await runCheckoutPayment({
        clientSecret: created.payment.clientSecret,
      });

      if (paymentResult === 'canceled') {
        setError('Paiement annulé.');
        return;
      }
      if (paymentResult === 'failed') {
        setError('Paiement refusé. Réessaie ou change de carte.');
        return;
      }

      const { reference, id: bookingId, pricingSnapshot } = created.booking;
      reset();
      router.replace({
        pathname: '/book/confirm',
        params: {
          bookingId,
          reference,
          totalCents: String(pricingSnapshot.totalCents),
        },
      });
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!offerId || !quote || !slotStart || !address) {
    return (
      <View style={{ flex: 1, padding: spacing[7], justifyContent: 'center' }}>
        <Text style={{ color: colors.neutral[700] }}>Aucune réservation en cours.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: 160 }}
      >
        <Text
          style={{
            fontSize: typography.size.title,
            fontWeight: '700',
            color: colors.neutral[900],
          }}
        >
          Paiement
        </Text>
        <Text style={{ color: colors.neutral[700] }}>{offerName}</Text>
        <Text style={{ color: colors.neutral[700] }}>
          {address.line1}, {address.postalCode} {address.city}
        </Text>
        <Text style={{ color: colors.neutral[700] }}>Créneau : {formatSlotFr(slotStart)}</Text>
        <Text
          style={{
            color: colors.brand.primary,
            fontWeight: '700',
            fontSize: typography.size.title,
          }}
        >
          {totalLabel}
        </Text>

        {env.useMocks || !env.stripePublishableKey ? (
          <Text style={{ color: colors.neutral[500], fontSize: typography.size.caption }}>
            Mode mock — paiement simulé (PaymentSheet natif si clé Stripe + mocks off).
          </Text>
        ) : null}

        {error ? <ErrorBanner message={error} /> : null}

        <Checkbox
          checked={acceptCgv}
          onChange={setAcceptCgv}
          label="J'accepte les CGV et le prélèvement du montant TTC"
          testID="pay-cgv"
        />
      </ScrollView>

      <StickyCta
        testID="pay-submit"
        label={totalLabel ? `Payer ${totalLabel}` : 'Payer'}
        loading={loading}
        disabled={!acceptCgv}
        onPress={() => void onPay()}
      />
    </View>
  );
}
