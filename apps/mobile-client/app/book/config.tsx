import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BookingStepper } from '../../src/components/booking/booking-stepper';
import { Checkbox } from '../../src/components/ui/checkbox';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { StickyCta } from '../../src/components/ui/sticky-cta';
import { fetchQuote } from '../../src/data/quote';
import { mapApiError } from '../../src/lib/api-errors';
import { DIRT_OPTIONS, VEHICLE_OPTIONS } from '../../src/lib/booking-labels';
import { formatPriceEur } from '../../src/lib/format';
import { useBookingDraftStore } from '../../src/stores/booking-draft.store';
import { useTheme } from '../../src/theme/theme-provider';

/** C05 Config + quote live — CS-M11-S04 */
export default function ConfigScreen() {
  const { colors, spacing, typography, radius } = useTheme();

  const offerId = useBookingDraftStore((s) => s.offerId);
  const offerName = useBookingDraftStore((s) => s.offerName);
  const offerOptions = useBookingDraftStore((s) => s.offerOptions);
  const vehicleType = useBookingDraftStore((s) => s.vehicleType);
  const dirtLevel = useBookingDraftStore((s) => s.dirtLevel);
  const optionIds = useBookingDraftStore((s) => s.optionIds);
  const zoneSlug = useBookingDraftStore((s) => s.zoneSlug);
  const quote = useBookingDraftStore((s) => s.quote);
  const setVehicleType = useBookingDraftStore((s) => s.setVehicleType);
  const setDirtLevel = useBookingDraftStore((s) => s.setDirtLevel);
  const toggleOption = useBookingDraftStore((s) => s.toggleOption);
  const setQuote = useBookingDraftStore((s) => s.setQuote);

  const [error, setError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount-only: do not re-redirect when draft is cleared after checkout (stack still mounted).
  useEffect(() => {
    if (!useBookingDraftStore.getState().offerId) {
      router.replace('/book/catalog');
    }
  }, []);

  useEffect(() => {
    if (!offerId) {
      return;
    }
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      setQuoting(true);
      setError(null);
      void fetchQuote({
        offerId,
        vehicleType,
        optionIds,
        zoneSlug,
        dirtLevel,
      })
        .then((result) => setQuote(result))
        .catch((err) => setError(mapApiError(err)))
        .finally(() => setQuoting(false));
    }, 300);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [offerId, vehicleType, dirtLevel, optionIds, zoneSlug, setQuote]);

  const onRetry = useCallback(() => {
    if (!offerId) {
      return;
    }
    setQuoting(true);
    void fetchQuote({
      offerId,
      vehicleType,
      optionIds,
      zoneSlug,
      dirtLevel,
    })
      .then((result) => setQuote(result))
      .catch((err) => setError(mapApiError(err)))
      .finally(() => setQuoting(false));
  }, [offerId, vehicleType, optionIds, zoneSlug, dirtLevel, setQuote]);

  const total = quote?.breakdown.totalCents;

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
      <BookingStepper current={1} />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          gap: spacing[5],
          paddingBottom: 140,
        }}
      >
        <Text style={{ fontSize: typography.size.title, fontWeight: '700', color: colors.neutral[900] }}>
          {offerName}
        </Text>

        {error ? <ErrorBanner message={error} onAction={onRetry} /> : null}

        <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>Type de véhicule</Text>
        <View style={{ gap: spacing[3] }}>
          {VEHICLE_OPTIONS.map((opt) => {
            const selected = vehicleType === opt.value;
            return (
              <Pressable
                key={opt.value}
                testID={`vehicle-${opt.value}`}
                onPress={() => setVehicleType(opt.value)}
                style={{
                  padding: spacing[4],
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: selected ? colors.brand.primary : colors.neutral[300],
                  backgroundColor: selected ? colors.brand.primaryLight : colors.neutral[0],
                }}
              >
                <Text style={{ color: colors.neutral[900], fontWeight: selected ? '700' : '500' }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>Niveau de saleté</Text>
        <View style={{ gap: spacing[3] }}>
          {DIRT_OPTIONS.map((opt) => {
            const selected = dirtLevel === opt.value;
            return (
              <Pressable
                key={opt.value}
                testID={`dirt-${opt.value}`}
                onPress={() => setDirtLevel(opt.value)}
                style={{
                  padding: spacing[4],
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: selected ? colors.brand.primary : colors.neutral[300],
                  backgroundColor: selected ? colors.brand.primaryLight : colors.neutral[0],
                }}
              >
                <Text style={{ color: colors.neutral[900], fontWeight: selected ? '700' : '500' }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {offerOptions.length > 0 ? (
          <>
            <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>Options</Text>
            <View style={{ gap: spacing[4] }}>
              {offerOptions.map((opt) => (
                <Checkbox
                  key={opt.id}
                  testID={`option-${opt.id}`}
                  checked={optionIds.includes(opt.id)}
                  onChange={() => toggleOption(opt.id)}
                  label={`${opt.name} (+${formatPriceEur(opt.priceDeltaCents)})`}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <StickyCta
        testID="config-continue"
        label="Continuer"
        loading={quoting}
        disabled={!quote}
        caption={total != null ? `Total TTC ${formatPriceEur(total)}` : quoting ? 'Calcul…' : undefined}
        onPress={() => router.push('/book/address')}
      />
    </View>
  );
}
