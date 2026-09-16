import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  BookingsSegmentControl,
  type BookingsSegment,
} from '../../src/components/booking/bookings-segment-control';
import { NextBookingCard } from '../../src/components/booking/next-booking-card';
import { EmptyState } from '../../src/components/ui/empty-state';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { listBookingsByGroup } from '../../src/data/bookings';
import type { HomeBookingSummary } from '../../src/data/home-types';
import { mapApiError } from '../../src/lib/api-errors';
import { useTheme } from '../../src/theme/theme-provider';

const EMPTY_COPY: Record<
  BookingsSegment,
  { title: string; description: string; action?: boolean }
> = {
  upcoming: {
    title: 'Rien de prévu',
    description: 'Ta prochaine réservation apparaîtra ici.',
    action: true,
  },
  past: {
    title: 'Aucune mission passée',
    description: 'Les lavages terminés s’afficheront ici.',
  },
  cancelled: {
    title: 'Aucune annulation',
    description: 'Les réservations annulées ou non assignées s’affichent ici.',
  },
};

/** C12 Liste réservations — CS-M11-S09 */
export default function BookingsScreen() {
  const { colors, spacing, typography } = useTheme();
  const [segment, setSegment] = useState<BookingsSegment>('upcoming');
  const [items, setItems] = useState<HomeBookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial', group: BookingsSegment = segment) => {
      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const list = await listBookingsByGroup(group);
        setItems(list);
      } catch (err) {
        setError(mapApiError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [segment],
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial', segment);
    }, [load, segment]),
  );

  const empty = useMemo(() => EMPTY_COPY[segment], [segment]);

  const onSegmentChange = (next: BookingsSegment) => {
    setSegment(next);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.neutral[100] }}
      contentContainerStyle={{ padding: spacing[7], gap: spacing[5], paddingBottom: spacing[10] }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void load('refresh', segment)}
        />
      }
      testID="bookings-list"
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

      <BookingsSegmentControl
        value={segment}
        onChange={onSegmentChange}
        testID="bookings-segments"
      />

      {error ? <ErrorBanner message={error} onAction={() => void load('initial', segment)} /> : null}
      {loading ? <ActivityIndicator color={colors.brand.primary} /> : null}

      {!loading && !error ? (
        items.length === 0 ? (
          <EmptyState
            title={empty.title}
            description={empty.description}
            actionLabel={empty.action ? 'Réserver' : undefined}
            onAction={empty.action ? () => router.push('/book/catalog') : undefined}
            testID={`bookings-empty-${segment}`}
          />
        ) : (
          <View style={{ gap: spacing[4] }}>
            {items.map((b) => (
              <NextBookingCard
                key={b.id}
                booking={b}
                testID={`booking-${segment}-${b.id}`}
                onPress={() => router.push(`/bookings/${b.id}`)}
              />
            ))}
          </View>
        )
      ) : null}
    </ScrollView>
  );
}
