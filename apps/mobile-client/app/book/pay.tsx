import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { formatPriceEur, formatSlotFr } from '../../src/lib/format';
import { useBookingDraftStore } from '../../src/stores/booking-draft.store';
import { useTheme } from '../../src/theme/theme-provider';

/** C08 Paiement — stub until CS-M11-S05 */
export default function PayStubScreen() {
  const { colors, spacing, typography } = useTheme();
  const offerName = useBookingDraftStore((s) => s.offerName);
  const quote = useBookingDraftStore((s) => s.quote);
  const slotStart = useBookingDraftStore((s) => s.slotStart);
  const address = useBookingDraftStore((s) => s.address);

  return (
    <View
      style={{
        flex: 1,
        padding: spacing[7],
        backgroundColor: colors.neutral[100],
        gap: spacing[4],
      }}
    >
      <Text style={{ fontSize: typography.size.title, fontWeight: '700', color: colors.neutral[900] }}>
        Récapitulatif
      </Text>
      <Text style={{ color: colors.neutral[700] }}>
        {offerName}
        {quote ? ` · ${formatPriceEur(quote.breakdown.totalCents)}` : ''}
      </Text>
      {slotStart ? (
        <Text style={{ color: colors.neutral[700] }}>Créneau : {formatSlotFr(slotStart)}</Text>
      ) : null}
      {address ? (
        <Text style={{ color: colors.neutral[700] }}>
          {address.line1}, {address.postalCode} {address.city}
        </Text>
      ) : null}
      <Text style={{ color: colors.neutral[500], marginTop: spacing[3] }}>
        Paiement Stripe PaymentSheet = prochaine story (CS-M11-S05).
      </Text>
      <Button onPress={() => router.replace('/(tabs)')}>Retour accueil</Button>
    </View>
  );
}
