import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { Input } from '../../src/components/ui/input';
import { createOutOfZoneLead } from '../../src/data/zones';
import { mapApiError } from '../../src/lib/api-errors';
import { useBookingDraftStore } from '../../src/stores/booking-draft.store';
import { useTheme } from '../../src/theme/theme-provider';

/** Hors zone lead capture — CS-M11-S04 / DEV-S06 */
export default function OutOfZoneScreen() {
  const { colors, spacing, typography } = useTheme();
  const address = useBookingDraftStore((s) => s.address);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!address) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createOutOfZoneLead({
        email: email.trim() || undefined,
        addressText: `${address.line1}, ${address.postalCode} ${address.city}`,
        lat: address.lat,
        lng: address.lng,
      });
      setDone(true);
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: spacing[7], backgroundColor: colors.neutral[100], gap: spacing[4] }}>
      <Text style={{ fontSize: typography.size.title, fontWeight: '700', color: colors.neutral[900] }}>
        Bientôt disponible chez vous
      </Text>
      <Text style={{ color: colors.neutral[700] }}>
        Cette adresse est hors zone pour le moment. Laisse ton email pour être prévenu.
      </Text>
      {error ? <ErrorBanner message={error} /> : null}
      {done ? (
        <Text style={{ color: colors.brand.primary, fontWeight: '600' }}>Merci, on te prévient !</Text>
      ) : (
        <>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="outzone-email"
          />
          <Button loading={loading} onPress={() => void onSubmit()} testID="outzone-submit">
            Me prévenir
          </Button>
        </>
      )}
      <Button variant="secondary" onPress={() => router.replace('/(tabs)')}>
        Retour à l’accueil
      </Button>
    </View>
  );
}
