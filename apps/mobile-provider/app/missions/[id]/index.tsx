import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DeclineSheet } from '../../../src/components/missions/decline-sheet';
import { ErrorBanner } from '../../../src/components/ui/error-banner';
import { Button } from '../../../src/components/ui/button';
import {
  acceptMission,
  canConfirmDecline,
  declineMission,
  DECLINE_REASONS,
  fetchMissionDetail,
  type DeclineReasonId,
  type MissionDetailModel,
} from '../../../src/data/missions';
import { mapApiError } from '../../../src/lib/api-errors';
import { missionLocationCopy } from '../../../src/lib/mission-format';
import { useTheme } from '../../../src/theme/theme-provider';

const HELPER =
  'Plusieurs pros voient cette mission. Le premier qui accepte la prend.';

/** P03 Détail — CS-M12-S05. Pas de chrono 8 s. */
export default function MissionDetailScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = typeof params.id === 'string' ? params.id : '';

  const [detail, setDetail] = useState<MissionDetailModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reasonId, setReasonId] = useState<DeclineReasonId | null>(null);
  const [otherText, setOtherText] = useState('');
  const [declining, setDeclining] = useState(false);

  const load = useCallback(async () => {
    if (!bookingId) {
      return;
    }
    try {
      setDetail(await fetchMissionDetail(bookingId));
      setError(null);
    } catch (err) {
      setError(mapApiError(err));
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAccept = async () => {
    if (!bookingId || accepting) {
      return;
    }
    setAccepting(true);
    setError(null);
    try {
      await acceptMission(bookingId);
      router.replace(`/missions/${bookingId}/active` as Href);
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code)
          : '';
      if (code === 'BOOKING_ALREADY_ACCEPTED') {
        router.replace(`/missions/${bookingId}/taken` as Href);
        return;
      }
      setError(mapApiError(err));
    } finally {
      setAccepting(false);
    }
  };

  const onDeclineConfirm = async () => {
    if (!bookingId || !canConfirmDecline(reasonId) || !reasonId) {
      return;
    }
    const label = DECLINE_REASONS.find((item) => item.id === reasonId)?.label ?? '';
    const reason =
      reasonId === 'other' && otherText.trim()
        ? `${label}: ${otherText.trim()}`
        : label;
    setDeclining(true);
    try {
      await declineMission(bookingId, reason);
      router.replace('/(tabs)/missions' as Href);
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setDeclining(false);
      setDeclineOpen(false);
    }
  };

  const location = detail
    ? missionLocationCopy({ quartier: detail.quartier, street: detail.street })
    : null;

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
          testID="mission-detail-back"
          onPress={() => router.back()}
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
          Détail de la mission
        </Text>
      </View>

      {!detail ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {error ? <ErrorBanner message={error} /> : <ActivityIndicator color={colors.brand.primary} />}
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing[5],
              paddingBottom: spacing[5],
              gap: spacing[3],
            }}
          >
            {error ? <ErrorBanner message={error} /> : null}
            <View
              style={{
                backgroundColor: colors.neutral[0],
                borderRadius: radius.lg,
                padding: spacing[7],
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.neutral[700], fontWeight: '600' }}>
                Vous gagnez
              </Text>
              <Text
                testID="mission-hero-net"
                style={{
                  color: colors.brand.primary,
                  fontSize: 32,
                  fontWeight: '800',
                  marginTop: spacing[2],
                }}
              >
                {detail.netLabel}
              </Text>
              <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
                Frais et commission déjà déduits.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.neutral[0],
                borderRadius: radius.md,
                padding: spacing[5],
              }}
            >
              <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>
                {detail.offerName}
              </Text>
              <Text style={{ color: colors.neutral[700], fontSize: typography.size.caption }}>
                {detail.offerHint}
              </Text>
              <Text
                style={{
                  marginTop: spacing[2],
                  color: colors.neutral[500],
                  fontSize: typography.size.label,
                }}
              >
                {detail.durationLabel}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.neutral[0],
                borderRadius: radius.md,
                padding: spacing[5],
              }}
            >
              <Text
                testID="mission-detail-quartier"
                style={{ color: colors.neutral[900], fontWeight: '700' }}
              >
                {location?.title}
              </Text>
              <Text
                testID="mission-detail-address-hint"
                style={{ color: colors.neutral[700], fontSize: typography.size.caption }}
              >
                {location?.hint}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.neutral[0],
                borderRadius: radius.md,
                padding: spacing[5],
              }}
            >
              <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>
                {detail.slotLabel}
              </Text>
              <Text style={{ color: colors.neutral[700], fontSize: typography.size.caption }}>
                Durée estimée : {detail.durationLabel}
              </Text>
            </View>

            <Text style={{ color: colors.neutral[700], fontSize: typography.size.caption }}>
              Véhicule : {detail.vehicleLabel}
            </Text>
          </ScrollView>

          <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[5] }}>
            <Text
              testID="mission-broadcast-helper"
              style={{
                color: colors.neutral[700],
                fontSize: typography.size.label,
                textAlign: 'center',
                marginBottom: spacing[3],
              }}
            >
              {HELPER}
            </Text>
            <Button
              testID="mission-accept"
              loading={accepting}
              onPress={() => void onAccept()}
            >
              {accepting ? 'Vérification…' : 'Accepter la mission'}
            </Button>
            <Pressable
              testID="mission-refuse"
              disabled={accepting}
              onPress={() => setDeclineOpen(true)}
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
                Refuser
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <DeclineSheet
        visible={declineOpen}
        reasonId={reasonId}
        otherText={otherText}
        canConfirm={canConfirmDecline(reasonId)}
        loading={declining}
        onReason={setReasonId}
        onOtherText={setOtherText}
        onConfirm={() => void onDeclineConfirm()}
        onCancel={() => setDeclineOpen(false)}
      />
    </SafeAreaView>
  );
}
