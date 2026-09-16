import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BookingStepper } from '../../src/components/booking/booking-stepper';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { Input } from '../../src/components/ui/input';
import { StickyCta } from '../../src/components/ui/sticky-cta';
import { checkZone } from '../../src/data/zones';
import { resolveBookingAddressId } from '../../src/data/addresses';
import { mapApiError } from '../../src/lib/api-errors';
import { useBookingDraftStore } from '../../src/stores/booking-draft.store';
import { useTheme } from '../../src/theme/theme-provider';

const LYON_DEMO = {
  line1: '12 rue de la République',
  city: 'Lyon',
  postalCode: '69001',
  lat: 45.764,
  lng: 4.8357,
};

/** C06 Adresse + zone check — CS-M11-S04 (Places = S12) */
export default function AddressScreen() {
  const { colors, spacing, typography } = useTheme();
  const setAddressResult = useBookingDraftStore((s) => s.setAddressResult);
  const offerId = useBookingDraftStore((s) => s.offerId);

  const [line1, setLine1] = useState(LYON_DEMO.line1);
  const [city, setCity] = useState(LYON_DEMO.city);
  const [postalCode, setPostalCode] = useState(LYON_DEMO.postalCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mount-only: do not re-redirect when draft is cleared after checkout (stack still mounted).
  useEffect(() => {
    if (!useBookingDraftStore.getState().offerId) {
      router.replace('/book/catalog');
    }
  }, []);

  const onContinue = async () => {
    setError(null);
    if (line1.trim().length < 5 || city.trim().length < 2 || postalCode.trim().length < 4) {
      setError('Complète une adresse valide.');
      return;
    }
    setLoading(true);
    try {
      const lat = postalCode.startsWith('69') ? LYON_DEMO.lat : 48.8566;
      const lng = postalCode.startsWith('69') ? LYON_DEMO.lng : 2.3522;
      const result = await checkZone({ lat, lng, postalCode: postalCode.trim() });
      if (!result.covered) {
        setAddressResult({
          address: {
            line1: line1.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
            lat,
            lng,
            addressId: null,
          },
          covered: false,
        });
        router.push('/book/out-of-zone');
        return;
      }
      setAddressResult({
        address: {
          line1: line1.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          lat,
          lng,
          addressId: await resolveBookingAddressId({
            line1: line1.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
            lat,
            lng,
          }),
        },
        covered: true,
        zoneSlug: result.zone.slug,
        zoneName: result.zone.name,
      });
      router.push('/book/slot');
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!offerId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral[100], justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', color: colors.neutral[700] }}>
          Redirection…
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
      <BookingStepper current={2} />
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: 140 }}>
        <Text style={{ fontSize: typography.size.body, color: colors.neutral[700] }}>
          Où doit se faire le lavage ? (autocomplete Places = S12)
        </Text>
        {error ? <ErrorBanner message={error} /> : null}
        <Input label="Adresse" value={line1} onChangeText={setLine1} testID="address-line1" />
        <Input label="Ville" value={city} onChangeText={setCity} testID="address-city" />
        <Input
          label="Code postal"
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="number-pad"
          testID="address-postal"
        />
      </ScrollView>
      <StickyCta
        testID="address-continue"
        label="Vérifier la zone"
        loading={loading}
        onPress={() => void onContinue()}
      />
    </View>
  );
}
