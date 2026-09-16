import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AddressAutocomplete } from '../../src/components/booking/address-autocomplete';
import { BookingStepper } from '../../src/components/booking/booking-stepper';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { Input } from '../../src/components/ui/input';
import { StickyCta } from '../../src/components/ui/sticky-cta';
import { checkZone } from '../../src/data/zones';
import { resolveBookingAddressId } from '../../src/data/addresses';
import type { ResolvedPlace } from '../../src/data/places';
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

/** C06 Adresse + Places autocomplete — CS-M11-S12 */
export default function AddressScreen() {
  const { colors, spacing, typography } = useTheme();
  const setAddressResult = useBookingDraftStore((s) => s.setAddressResult);
  const offerId = useBookingDraftStore((s) => s.offerId);

  const [line1, setLine1] = useState(LYON_DEMO.line1);
  const [city, setCity] = useState(LYON_DEMO.city);
  const [postalCode, setPostalCode] = useState(LYON_DEMO.postalCode);
  const [complement, setComplement] = useState('');
  const [lat, setLat] = useState(LYON_DEMO.lat);
  const [lng, setLng] = useState(LYON_DEMO.lng);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!useBookingDraftStore.getState().offerId) {
      router.replace('/book/catalog');
    }
  }, []);

  const onPlaceResolved = (place: ResolvedPlace) => {
    setLine1(place.line1);
    setCity(place.city);
    setPostalCode(place.postalCode);
    setLat(place.lat);
    setLng(place.lng);
    setError(null);
  };

  const onContinue = async () => {
    setError(null);
    if (line1.trim().length < 5 || city.trim().length < 2 || postalCode.trim().length < 4) {
      setError('Complète une adresse valide (ou choisis une suggestion).');
      return;
    }
    setLoading(true);
    try {
      const result = await checkZone({
        lat,
        lng,
        postalCode: postalCode.trim(),
      });
      const lineWithComplement = complement.trim()
        ? `${line1.trim()} (${complement.trim()})`
        : line1.trim();
      if (!result.covered) {
        setAddressResult({
          address: {
            line1: lineWithComplement,
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
          line1: lineWithComplement,
          city: city.trim(),
          postalCode: postalCode.trim(),
          lat,
          lng,
          addressId: await resolveBookingAddressId({
            line1: lineWithComplement,
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: 140 }}
      >
        <Text style={{ fontSize: typography.size.body, color: colors.neutral[700] }}>
          Où doit se faire le lavage ?
        </Text>
        {error ? <ErrorBanner message={error} /> : null}
        <AddressAutocomplete
          value={line1}
          onChangeText={setLine1}
          onPlaceResolved={onPlaceResolved}
        />
        <Input
          label="Complément (digicode, étage…)"
          value={complement}
          onChangeText={setComplement}
          testID="address-complement"
          placeholder="Optionnel"
        />
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
