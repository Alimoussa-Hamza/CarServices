import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CancelSheet } from '../../../src/components/missions/cancel-sheet';
import { MissionMapPlaceholder } from '../../../src/components/missions/mission-map-placeholder';
import { ErrorBanner } from '../../../src/components/ui/error-banner';
import { Button } from '../../../src/components/ui/button';
import {
  CANCEL_REASONS,
  canConfirmCancel,
  cancelAssignedMission,
  fetchMissionDetail,
  markArrived,
  startEnRoute,
  type CancelReasonId,
  type MissionDetailModel,
} from '../../../src/data/missions';
import { mapApiError } from '../../../src/lib/api-errors';
import { copyText, currentMapsPlatform } from '../../../src/lib/copy-text';
import {
  enRouteCtaLabel,
  mapsDirectionsUrl,
  telUrl,
} from '../../../src/lib/mission-format';
import { useTheme } from '../../../src/theme/theme-provider';

/** P04 En route — CS-M12-S06. Maps système, pas de GPS in-app. */
export default function MissionActiveScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = typeof params.id === 'string' ? params.id : '';

  const [detail, setDetail] = useState<MissionDetailModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reasonId, setReasonId] = useState<CancelReasonId | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!bookingId) {
      return;
    }
    try {
      const next = await fetchMissionDetail(bookingId);
      if (next.status === 'in_progress') {
        router.replace(`/missions/${bookingId}/execute` as Href);
        return;
      }
      if (next.status === 'pending_provider' || !next.street) {
        router.replace(`/missions/${bookingId}` as Href);
        return;
      }
      setDetail(next);
      setError(null);
    } catch (err) {
      setError(mapApiError(err));
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onStatus = async () => {
    if (!bookingId || !detail || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (detail.status === 'accepted') {
        setDetail(await startEnRoute(bookingId));
        return;
      }
      if (detail.status === 'en_route') {
        await markArrived(bookingId);
        router.replace(`/missions/${bookingId}/execute` as Href);
      }
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onOpenMaps = () => {
    if (!detail || detail.lat == null || detail.lng == null || !detail.street) {
      return;
    }
    void Linking.openURL(
      mapsDirectionsUrl({
        lat: detail.lat,
        lng: detail.lng,
        label: detail.street,
        platform: currentMapsPlatform(),
      }),
    );
  };

  const onCall = () => {
    if (!detail?.clientPhone) {
      return;
    }
    void Linking.openURL(telUrl(detail.clientPhone));
  };

  const onCopy = async () => {
    if (!detail?.street) {
      return;
    }
    await copyText(detail.street);
    setCopied(true);
  };

  const onCancelConfirm = async () => {
    if (!bookingId || !canConfirmCancel(reasonId) || !reasonId) {
      return;
    }
    const reason = CANCEL_REASONS.find((item) => item.id === reasonId)?.label ?? '';
    setCancelling(true);
    try {
      await cancelAssignedMission(bookingId, reason);
      router.replace('/(tabs)/missions' as Href);
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setCancelling(false);
      setCancelOpen(false);
    }
  };

  const cta = detail ? enRouteCtaLabel(detail.status) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing[5],
          paddingVertical: spacing[3],
        }}
      >
        <Pressable
          testID="mission-active-back"
          onPress={() => router.replace('/(tabs)/missions' as Href)}
          style={{ width: 36, height: 36, justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.neutral[900]} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            color: colors.neutral[900],
            fontWeight: '700',
            marginRight: 36,
          }}
        >
          Mission acceptée
        </Text>
      </View>

      {!detail ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {error ? <ErrorBanner message={error} /> : <ActivityIndicator color={colors.brand.primary} />}
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: spacing[5] }}>
            {error ? (
              <View style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}>
                <ErrorBanner message={error} />
              </View>
            ) : null}
            <MissionMapPlaceholder onOpenMaps={onOpenMaps} />
            <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4], gap: spacing[3] }}>
              <View
                style={{
                  backgroundColor: colors.neutral[0],
                  borderRadius: radius.md,
                  padding: spacing[5],
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] }}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.brand.primary}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    testID="mission-active-street"
                    style={{
                      flex: 1,
                      color: colors.neutral[900],
                      fontWeight: '700',
                      fontSize: typography.size.caption,
                    }}
                  >
                    {detail.street}
                  </Text>
                  <Pressable
                    testID="mission-copy-address"
                    onPress={() => void onCopy()}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: '#F0F2F4',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="copy-outline" size={16} color={colors.neutral[700]} />
                  </Pressable>
                </View>
                <Text
                  style={{
                    color: colors.neutral[700],
                    fontSize: typography.size.label,
                    fontWeight: '500',
                    paddingLeft: 24,
                    marginTop: 4,
                  }}
                >
                  {detail.quartier}
                  {detail.complement ? ` · ${detail.complement}` : ''}
                  {copied ? ' · Copiée' : ''}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: colors.neutral[0],
                  borderRadius: radius.md,
                  padding: spacing[5],
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>
                    {detail.offerName}
                  </Text>
                  <Text
                    testID="mission-active-net"
                    style={{ color: colors.brand.primary, fontWeight: '700' }}
                  >
                    {detail.netLabel}
                  </Text>
                </View>
                <Text style={{ color: colors.neutral[700], fontSize: typography.size.label }}>
                  {detail.slotLabel} · {detail.durationLabel}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: colors.neutral[0],
                  borderRadius: radius.md,
                  padding: spacing[5],
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  <Ionicons name="person-circle-outline" size={22} color={colors.neutral[500]} />
                  <Text style={{ color: colors.neutral[900], fontWeight: '600' }}>
                    Client vérifié
                  </Text>
                </View>
                <Pressable
                  testID="mission-call-client"
                  onPress={onCall}
                  disabled={!detail.clientPhone}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.brand.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="call" size={16} color={colors.brand.primary} />
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <View
            style={{
              paddingHorizontal: spacing[4],
              paddingTop: spacing[3],
              paddingBottom: spacing[5],
              backgroundColor: colors.neutral[100],
            }}
          >
            {cta ? (
              <Button
                testID="mission-en-route-cta"
                loading={busy}
                onPress={() => void onStatus()}
              >
                {cta}
              </Button>
            ) : null}
            <Pressable
              testID="mission-cancel"
              disabled={busy}
              onPress={() => setCancelOpen(true)}
              style={{
                marginTop: spacing[3],
                minHeight: 48,
                borderRadius: radius.md,
                borderWidth: 2,
                borderColor: colors.semantic.error,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.semantic.error, fontWeight: '700' }}>
                Annuler la mission
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <CancelSheet
        visible={cancelOpen}
        reasonId={reasonId}
        canConfirm={canConfirmCancel(reasonId)}
        loading={cancelling}
        onReason={setReasonId}
        onConfirm={() => void onCancelConfirm()}
        onCancel={() => setCancelOpen(false)}
      />
    </SafeAreaView>
  );
}
