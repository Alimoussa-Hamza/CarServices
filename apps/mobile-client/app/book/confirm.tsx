import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { formatPriceEur } from '../../src/lib/format';
import { useTheme } from '../../src/theme/theme-provider';

/** C09 Confirmation — CS-M11-S05 / S06 light */
export default function ConfirmScreen() {
  const { colors, spacing, typography } = useTheme();
  const params = useLocalSearchParams<{
    bookingId?: string;
    reference?: string;
    totalCents?: string;
  }>();

  const totalCents = params.totalCents ? Number(params.totalCents) : null;

  return (
    <View
      style={{
        flex: 1,
        padding: spacing[7],
        backgroundColor: colors.neutral[100],
        justifyContent: 'center',
        gap: spacing[4],
      }}
    >
      <Text
        style={{
          fontSize: typography.size.display,
          fontWeight: '700',
          color: colors.brand.primary,
        }}
      >
        Merci !
      </Text>
      <Text style={{ fontSize: typography.size.title, fontWeight: '700', color: colors.neutral[900] }}>
        Réservation confirmée
      </Text>
      {params.reference ? (
        <Text style={{ color: colors.neutral[700] }} testID="confirm-reference">
          Réf. {params.reference}
        </Text>
      ) : null}
      {totalCents != null && !Number.isNaN(totalCents) ? (
        <Text style={{ color: colors.neutral[700] }}>{formatPriceEur(totalCents)}</Text>
      ) : null}
      <Text style={{ color: colors.neutral[500] }}>
        Un pro va être recherché. Tu pourras suivre la mission dans Réservations.
      </Text>
      <Button
        testID="confirm-bookings"
        onPress={() => router.replace('/(tabs)/bookings')}
      >
        Voir mes réservations
      </Button>
      <Button variant="secondary" onPress={() => router.replace('/(tabs)')}>
        Retour à l’accueil
      </Button>
    </View>
  );
}
