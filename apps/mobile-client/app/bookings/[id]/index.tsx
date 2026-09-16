import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import type { BookingDetail } from '@carservice/shared-types';
import { StatusTimeline } from '../../../src/components/booking/status-timeline';
import { Badge } from '../../../src/components/ui/badge';
import { Button } from '../../../src/components/ui/button';
import { ErrorBanner } from '../../../src/components/ui/error-banner';
import { getBookingDetail } from '../../../src/data/bookings';
import { mapApiError } from '../../../src/lib/api-errors';
import { formatBookingStatus } from '../../../src/lib/booking-status';
import {
  buildClientTimeline,
  canRevealFullAddress,
  canShowCancelCta,
  isTerminalUnassigned,
} from '../../../src/lib/booking-timeline';
import {
  canLeaveReview,
  completedAtFromTimeline,
} from '../../../src/lib/review-eligibility';
import { formatPriceEur, formatSlotFr } from '../../../src/lib/format';
import { useTheme } from '../../../src/theme/theme-provider';

const POLL_MS = 15_000;

/** C10 Suivi mission — CS-M11-S07 */
export default function BookingTrackingScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'poll' = 'initial') => {
    if (!bookingId) {
      setError('Réservation introuvable.');
      setLoading(false);
      return;
    }
    if (mode === 'refresh') {
      setRefreshing(true);
    } else if (mode === 'initial') {
      setLoading(true);
    }
    if (mode !== 'poll') {
      setError(null);
    }
    try {
      const next = await getBookingDetail(bookingId);
      if (mounted.current) {
        setDetail(next);
      }
    } catch (err) {
      if (mounted.current && mode !== 'poll') {
        setError(mapApiError(err));
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [bookingId]);

  useEffect(() => {
    mounted.current = true;
    void load('initial');
    const timer = setInterval(() => {
      void load('poll');
    }, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [load]);

  const steps = useMemo(
    () => (detail ? buildClientTimeline(detail.status, detail.timeline) : []),
    [detail],
  );

  const addressLabel = useMemo(() => {
    if (!detail?.addressSnapshot) {
      return detail?.zone.name ?? 'Zone';
    }
    if (canRevealFullAddress(detail.status)) {
      const a = detail.addressSnapshot;
      return `${a.street}, ${a.postalCode} ${a.city}`;
    }
    return `${detail.zone.name} · adresse exacte après confirmation du pro`;
  }, [detail]);

  const onCancel = () => {
    Alert.alert(
      'Annuler la réservation',
      'L’annulation in-app arrive bientôt. Contacte le support si besoin.',
    );
  };

  const onCallSupport = () => {
    void Linking.openURL('mailto:support@carservice.app?subject=Signalement%20mission');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: detail?.reference ? `Suivi ${detail.reference.slice(-4)}` : 'Suivi',
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.neutral[100] }}
        contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: spacing[10] }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} />
        }
        testID="booking-tracking"
      >
        {error ? <ErrorBanner message={error} onAction={() => void load('initial')} /> : null}
        {loading && !detail ? <ActivityIndicator color={colors.brand.primary} /> : null}

        {detail ? (
          <>
            <View
              style={{
                backgroundColor: colors.neutral[0],
                borderRadius: radius.md,
                padding: spacing[5],
                borderWidth: 1,
                borderColor: colors.neutral[300],
                gap: spacing[3],
              }}
            >
              <Text style={{ color: colors.neutral[500], fontSize: typography.size.caption }}>
                STATUT
              </Text>
              <Badge label={formatBookingStatus(detail.status)} tone="success" testID="tracking-status" />
              <Text
                style={{
                  fontSize: typography.size.title,
                  fontWeight: '700',
                  color: colors.neutral[900],
                }}
              >
                {formatBookingStatus(detail.status)}
              </Text>
              <Text style={{ color: colors.neutral[700] }}>Réf. {detail.reference}</Text>
            </View>

            {isTerminalUnassigned(detail.status) ? (
              <View
                style={{
                  backgroundColor: colors.neutral[0],
                  borderRadius: radius.md,
                  padding: spacing[5],
                  borderWidth: 1,
                  borderColor: colors.semantic.warning,
                  gap: spacing[3],
                }}
                testID="tracking-unassigned"
              >
                <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>
                  Aucun pro disponible
                </Text>
                <Text style={{ color: colors.neutral[700] }}>
                  Nous n’avons pas trouvé de professionnel pour ce créneau. Tu pourras
                  reprogrammer ou demander un remboursement bientôt.
                </Text>
              </View>
            ) : null}

            {detail.provider ? (
              <View
                style={{
                  backgroundColor: colors.neutral[0],
                  borderRadius: radius.md,
                  padding: spacing[5],
                  borderWidth: 1,
                  borderColor: colors.neutral[300],
                  gap: spacing[2],
                }}
                testID="tracking-provider"
              >
                <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>
                  {detail.provider.companyName ?? 'Professionnel'}
                </Text>
                <Text style={{ color: colors.neutral[700] }}>
                  ★ {detail.provider.ratingAvg.toFixed(1)}
                  {detail.provider.washMethods.includes('waterless')
                    ? ' · Lavage sans eau'
                    : ''}
                </Text>
              </View>
            ) : null}

            <View
              style={{
                backgroundColor: colors.neutral[0],
                borderRadius: radius.md,
                padding: spacing[5],
                borderWidth: 1,
                borderColor: colors.neutral[300],
              }}
            >
              <StatusTimeline steps={steps} testID="tracking-timeline" />
            </View>

            <View
              style={{
                backgroundColor: colors.neutral[0],
                borderRadius: radius.md,
                padding: spacing[5],
                borderWidth: 1,
                borderColor: colors.neutral[300],
                gap: spacing[2],
              }}
            >
              <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>Détails</Text>
              <Text style={{ color: colors.neutral[700] }}>
                {detail.offerName}
                {detail.vehicleType ? ` · ${detail.vehicleType}` : ''}
              </Text>
              <Text style={{ color: colors.neutral[700] }}>{formatSlotFr(detail.slotStart)}</Text>
              <Text style={{ color: colors.neutral[700] }} testID="tracking-address">
                {addressLabel}
              </Text>
              <Text style={{ color: colors.brand.primary, fontWeight: '700' }}>
                {formatPriceEur(detail.totalCents)}
              </Text>
            </View>

            {detail.status === 'in_progress' ? (
              <Text style={{ color: colors.neutral[500], fontSize: typography.size.caption }}>
                Annulation impossible pendant la prestation. Contacte le support en cas de
                problème.
              </Text>
            ) : null}

            {canShowCancelCta(detail.status, detail.slotStart) ? (
              <Button variant="secondary" onPress={onCancel} testID="tracking-cancel">
                Annuler la réservation
              </Button>
            ) : null}

            {detail.status === 'accepted' ||
            detail.status === 'en_route' ||
            detail.status === 'in_progress' ? (
              <Button variant="secondary" onPress={onCallSupport} testID="tracking-report">
                Signaler un problème
              </Button>
            ) : null}

            {canLeaveReview({
              status: detail.status,
              completedAtIso: completedAtFromTimeline(detail.timeline),
            }) ? (
              <Button
                testID="tracking-review"
                onPress={() => router.push(`/bookings/${detail.id}/review`)}
              >
                Laisser un avis
              </Button>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </>
  );
}
