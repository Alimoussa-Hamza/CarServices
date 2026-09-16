import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { BookingStepper } from '../../src/components/booking/booking-stepper';
import { OfferCard } from '../../src/components/booking/offer-card';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { listBookingOffers, type BookingOffer } from '../../src/data/catalog';
import { mapApiError } from '../../src/lib/api-errors';
import { useBookingDraftStore } from '../../src/stores/booking-draft.store';
import { useTheme } from '../../src/theme/theme-provider';

/** C04 Catalogue formules — CS-M11-S04 */
export default function CatalogScreen() {
  const { colors, spacing } = useTheme();
  const setOffer = useBookingDraftStore((s) => s.setOffer);
  const [offers, setOffers] = useState<BookingOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOffers(await listBookingOffers('lyon'));
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
      <BookingStepper current={0} />
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: spacing[10] }}>
        {error ? <ErrorBanner message={error} onAction={() => void load()} /> : null}
        {loading ? <ActivityIndicator color={colors.brand.primary} /> : null}
        {!loading
          ? offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                testID={`catalog-offer-${offer.id}`}
                onPress={() => {
                  setOffer({
                    id: offer.id,
                    name: offer.name,
                    priceCents: offer.priceCents,
                    durationMinutes: offer.durationMinutes,
                    options: offer.options.map((o) => ({
                      id: o.id,
                      name: o.name,
                      priceDeltaCents: o.priceDeltaCents,
                      durationDeltaMinutes: o.durationDeltaMinutes,
                    })),
                  });
                  router.push('/book/config');
                }}
              />
            ))
          : null}
      </ScrollView>
    </View>
  );
}
