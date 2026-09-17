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
import { CompleteSheet } from '../../../src/components/missions/complete-sheet';
import { PhotoSourceSheet } from '../../../src/components/missions/photo-source-sheet';
import { ErrorBanner } from '../../../src/components/ui/error-banner';
import { Button } from '../../../src/components/ui/button';
import {
  addExecutionPhoto,
  canCompleteExecution,
  completeMission,
  fetchExecution,
  MIN_AFTER_PHOTOS,
  MIN_BEFORE_PHOTOS,
  toggleChecklistItem,
  type ExecutionModel,
} from '../../../src/data/missions';
import { mapApiError } from '../../../src/lib/api-errors';
import { useTheme } from '../../../src/theme/theme-provider';

function elapsedLabel(startedAt: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/** P05 Exécution — CS-M12-S07. Capture = API. */
export default function MissionExecuteScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = typeof params.id === 'string' ? params.id : '';

  const [execution, setExecution] = useState<ExecutionModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceKind, setSourceKind] = useState<'before' | 'after' | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!bookingId) {
      return;
    }
    try {
      setExecution(await fetchExecution(bookingId));
      setError(null);
    } catch (err) {
      setError(mapApiError(err));
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onAddPhoto = async (kind: 'before' | 'after') => {
    if (!bookingId) {
      return;
    }
    setSourceKind(null);
    try {
      const next = await addExecutionPhoto(bookingId, kind);
      setExecution((prev) =>
        prev ? { ...next, checklist: prev.checklist } : next,
      );
    } catch (err) {
      setError(mapApiError(err));
    }
  };

  const onToggle = async (itemId: string) => {
    if (!bookingId || !execution) {
      return;
    }
    try {
      setExecution(await toggleChecklistItem(bookingId, itemId, execution));
    } catch (err) {
      setError(mapApiError(err));
    }
  };

  const onComplete = async () => {
    if (!bookingId || !execution || !canCompleteExecution(execution)) {
      return;
    }
    setBusy(true);
    try {
      await completeMission(bookingId);
      router.replace(`/missions/${bookingId}/done` as Href);
    } catch (err) {
      setError(mapApiError(err));
      setCompleteOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const ready = execution ? canCompleteExecution(execution) : false;

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
          testID="mission-execute-back"
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
          }}
        >
          {execution ? `${execution.offerName} — ${execution.quartier}` : 'Prestation'}
        </Text>
        <View
          style={{
            backgroundColor: '#F0F2F4',
            borderRadius: 99,
            paddingHorizontal: spacing[3],
            minHeight: 32,
            justifyContent: 'center',
          }}
        >
          <Text testID="mission-timer" style={{ fontWeight: '700', fontSize: 12 }}>
            {elapsedLabel(startedAt, now)}
          </Text>
        </View>
      </View>

      {!execution ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {error ? <ErrorBanner message={error} /> : <ActivityIndicator color={colors.brand.primary} />}
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing[5],
              paddingBottom: spacing[5],
              gap: spacing[6],
            }}
          >
            {error ? <ErrorBanner message={error} /> : null}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>Photos avant</Text>
                <Text
                  testID="mission-before-count"
                  style={{
                    color:
                      execution.beforeUris.length >= MIN_BEFORE_PHOTOS
                        ? colors.semantic.success
                        : colors.semantic.warning,
                    fontWeight: '700',
                    fontSize: 10,
                  }}
                >
                  Avant {execution.beforeUris.length}/{MIN_BEFORE_PHOTOS}
                </Text>
              </View>
              <Text style={{ color: colors.neutral[700], fontSize: typography.size.label, marginBottom: spacing[3] }}>
                Minimum 2 photos avant de commencer.
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                {execution.beforeUris.map((uri) => (
                  <View
                    key={uri}
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 12,
                      backgroundColor: '#E2E6EA',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="image-outline" size={22} color={colors.neutral[500]} />
                  </View>
                ))}
                {execution.beforeUris.length < 4 ? (
                  <Pressable
                    testID="mission-add-before"
                    onPress={() => setSourceKind('before')}
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: colors.neutral[300],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="camera-outline" size={22} color={colors.neutral[500]} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View>
              <Text style={{ color: colors.neutral[900], fontWeight: '700', marginBottom: spacing[3] }}>
                Checklist
              </Text>
              <View
                style={{
                  backgroundColor: colors.neutral[0],
                  borderRadius: radius.md,
                  overflow: 'hidden',
                }}
              >
                {execution.checklist.map((item) => (
                  <Pressable
                    key={item.id}
                    testID={`mission-check-${item.id}`}
                    onPress={() => void onToggle(item.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing[3],
                      padding: spacing[5],
                      borderBottomWidth: 1,
                      borderBottomColor: '#F0F2F4',
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        backgroundColor: item.done ? colors.semantic.success : colors.neutral[0],
                        borderWidth: item.done ? 0 : 2,
                        borderColor: colors.neutral[300],
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.done ? (
                        <Ionicons name="checkmark" size={12} color={colors.neutral[0]} />
                      ) : null}
                    </View>
                    <Text style={{ color: colors.neutral[900], fontWeight: '500' }}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>Photos après</Text>
                <Text
                  testID="mission-after-count"
                  style={{
                    color:
                      execution.afterUris.length >= MIN_AFTER_PHOTOS
                        ? colors.semantic.success
                        : colors.semantic.warning,
                    fontWeight: '700',
                    fontSize: 10,
                  }}
                >
                  Après {execution.afterUris.length}/{MIN_AFTER_PHOTOS}
                </Text>
              </View>
              <Text style={{ color: colors.neutral[700], fontSize: typography.size.label, marginBottom: spacing[3] }}>
                Minimum 2 photos après, obligatoires avant de terminer.
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                {execution.afterUris.map((uri) => (
                  <View
                    key={uri}
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 12,
                      backgroundColor: '#E2E6EA',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="image-outline" size={22} color={colors.neutral[500]} />
                  </View>
                ))}
                <Pressable
                  testID="mission-add-after"
                  onPress={() => setSourceKind('after')}
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: colors.neutral[300],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="camera-outline" size={22} color={colors.neutral[500]} />
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[5] }}>
            <Text
              testID="mission-complete-helper"
              style={{
                color: colors.neutral[700],
                fontSize: typography.size.label,
                textAlign: 'center',
                marginBottom: spacing[3],
              }}
            >
              Minimum 2 photos avant + 2 photos après et checklist complète pour terminer.
            </Text>
            <Button
              testID="mission-complete"
              disabled={!ready}
              onPress={() => setCompleteOpen(true)}
            >
              Terminer la prestation
            </Button>
          </View>
        </>
      )}

      <PhotoSourceSheet
        visible={sourceKind !== null}
        onCamera={() => sourceKind && void onAddPhoto(sourceKind)}
        onLibrary={() => sourceKind && void onAddPhoto(sourceKind)}
        onCancel={() => setSourceKind(null)}
      />
      <CompleteSheet
        visible={completeOpen}
        execution={execution}
        loading={busy}
        onConfirm={() => void onComplete()}
        onCancel={() => setCompleteOpen(false)}
      />
    </SafeAreaView>
  );
}
