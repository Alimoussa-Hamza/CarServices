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
import { EmptyState } from '../../src/components/ui/empty-state';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { listPastBookings, listUpcomingBookings } from '../../src/data/bookings';
import type { HomeBookingSummary } from '../../src/data/home-types';
import { mapApiError } from '../../src/lib/api-errors';
import { useTheme } from '../../src/theme/theme-provider';

/** C12 Liste — version light (full segments in CS-M11-S09) */
export default function BookingsScreen() {
  const { colors, spacing, typography } = useTheme();
  const [upcoming, setUpcoming] = useState<HomeBookingSummary[]>([]);
  const [past, setPast] = useState<HomeBookingSummary[]>([]);
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
      const [u, p] = await Promise.all([listUpcomingBookings(), listPastBookings()]);
      setUpcoming(u);
      setPast(p);
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.neutral[100] }}
      contentContainerStyle={{ padding: spacing[7], gap: spacing[5], paddingBottom: spacing[10] }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} />
      }
    >
      <Text
        style={{
          fontSize: typography.size.title,
          color: colors.neutral[900],
          fontWeight: '700',
        }}
      >
        Réservations
      </Text>

      {error ? <ErrorBanner message={error} onAction={() => void load('initial')} /> : null}
      {loading ? <ActivityIndicator color={colors.brand.primary} /> : null}

      {!loading ? (
        <>
          <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>À venir</Text>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Rien de prévu"
              description="Ta prochaine réservation apparaîtra ici."
              actionLabel="Réserver"
              onAction={() => router.push('/book/catalog')}
              testID="bookings-empty-upcoming"
            />
          ) : (
            upcoming.map((b) => (
              <NextBookingCard
                key={b.id}
                booking={b}
                testID={`booking-${b.id}`}
                onPress={() => router.push(`/bookings/${b.id}`)}
              />
            ))
          )}

          <Text style={{ fontWeight: '700', color: colors.neutral[900], marginTop: spacing[4] }}>
            Passées
          </Text>
          {past.length === 0 ? (
            <Text style={{ color: colors.neutral[500], fontSize: typography.size.caption }}>
              Aucune réservation passée.
            </Text>
          ) : (
            past.map((b) => (
              <NextBookingCard
                key={b.id}
                booking={b}
                testID={`booking-past-${b.id}`}
                onPress={() => router.push(`/bookings/${b.id}`)}
              />
            ))
          )}
        </>
      ) : null}
    </ScrollView>
  );
}
