import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { NextBookingCard } from '../../src/components/booking/next-booking-card';
import { OfferCard } from '../../src/components/booking/offer-card';
import { Badge } from '../../src/components/ui/badge';
import { Button } from '../../src/components/ui/button';
import { EmptyState } from '../../src/components/ui/empty-state';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { listUpcomingBookings } from '../../src/data/bookings';
import { listHomeOffers } from '../../src/data/catalog';
import type { HomeBookingSummary, HomeOffer } from '../../src/data/home-types';
import { mapApiError } from '../../src/lib/api-errors';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

/** C03 Home — CS-M11-S03 */
export default function HomeScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [offers, setOffers] = useState<HomeOffer[]>([]);
  const [nextBooking, setNextBooking] = useState<HomeBookingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [offerList, upcoming] = await Promise.all([
        listHomeOffers('lyon'),
        listUpcomingBookings(),
      ]);
      setOffers(offerList.slice(0, 4));
      setNextBooking(upcoming[0] ?? null);
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  const greeting = user?.phone
    ? `Bonjour`
    : 'Bonjour';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.neutral[100] }}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} />
      }
    >
      <View style={{ paddingHorizontal: spacing[7], paddingTop: spacing[8], gap: spacing[3] }}>
        <Text
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.title,
            fontWeight: '700',
          }}
        >
          {greeting}
        </Text>
        {user?.phone ? (
          <Text style={{ color: colors.neutral[500], fontSize: typography.size.caption }}>
            {user.phone}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          marginTop: spacing[5],
          marginHorizontal: spacing[7],
          backgroundColor: colors.brand.primary,
          borderRadius: radius.lg,
          padding: spacing[7],
          gap: spacing[3],
        }}
        testID="home-hero"
      >
        <Text
          style={{
            color: colors.neutral[0],
            fontSize: typography.size.label,
            fontWeight: '600',
            opacity: 0.9,
          }}
        >
          CarWash
        </Text>
        <Text
          style={{
            color: colors.neutral[0],
            fontSize: typography.size.display,
            lineHeight: typography.lineHeight.display,
            fontWeight: '700',
          }}
        >
          Lavage à domicile
        </Text>
        <Text style={{ color: colors.neutral[0], opacity: 0.9, fontSize: typography.size.body }}>
          Pro certifié, sans eau, chez vous
        </Text>
        <View style={{ marginTop: spacing[4] }}>
          <Button
            variant="secondary"
            testID="home-cta-book"
            onPress={() => router.push('/book/catalog')}
          >
            Réserver maintenant
          </Button>
        </View>
      </View>

      <View style={{ marginTop: spacing[5], paddingHorizontal: spacing[7] }}>
        <Badge label="Zone couverte · Lyon" tone="success" testID="home-zone-badge" />
      </View>

      {error ? (
        <View style={{ marginTop: spacing[5], paddingHorizontal: spacing[7] }}>
          <ErrorBanner message={error} onAction={() => void load('initial')} />
        </View>
      ) : null}

      <View style={{ marginTop: spacing[7], paddingHorizontal: spacing[7], gap: spacing[4] }}>
        <Text
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.body,
            fontWeight: '700',
          }}
        >
          Formules populaires
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.brand.primary} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] }}>
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                compact
                testID={`home-offer-${offer.id}`}
                onPress={() => router.push('/book/catalog')}
              />
            ))}
          </View>
        )}
      </View>

      <View style={{ marginTop: spacing[8], paddingHorizontal: spacing[7], gap: spacing[4] }}>
        <Text
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.body,
            fontWeight: '700',
          }}
        >
          Prochaine réservation
        </Text>
        {loading ? null : nextBooking ? (
          <NextBookingCard
            booking={nextBooking}
            testID="home-next-booking"
            onPress={() => router.push('/(tabs)/bookings')}
          />
        ) : (
          <EmptyState
            title="Aucune réservation à venir"
            description="Réserve un lavage en quelques minutes."
            actionLabel="Réserver maintenant"
            onAction={() => router.push('/book/catalog')}
            testID="home-empty-booking"
          />
        )}
      </View>
    </ScrollView>
  );
}
