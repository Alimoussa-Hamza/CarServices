import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MissionCard } from '../../src/components/missions/mission-card';
import { MissionTabs } from '../../src/components/missions/mission-tabs';
import { PauseSheet } from '../../src/components/missions/pause-sheet';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { KycToggle } from '../../src/components/kyc/toggle';
import {
  fetchMissionBoard,
  missionsForTab,
  type MissionBoard,
} from '../../src/data/missions';
import { mapApiError } from '../../src/lib/api-errors';
import { detectNewMissions } from '../../src/lib/mission-format';
import {
  isMissionsPaused,
  useMissionsUiStore,
} from '../../src/stores/missions-ui.store';
import { useTheme } from '../../src/theme/theme-provider';

const EMPTY_BOARD: MissionBoard = {
  newMissions: [],
  upcoming: [],
  active: [],
};

/** P02 Liste — CS-M12-S04 */
export default function MissionsScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const tab = useMissionsUiStore((s) => s.tab);
  const setTab = useMissionsUiStore((s) => s.setTab);
  const pauseSheetOpen = useMissionsUiStore((s) => s.pauseSheetOpen);
  const pauseChoice = useMissionsUiStore((s) => s.pauseChoice);
  const pausedUntil = useMissionsUiStore((s) => s.pausedUntil);
  const notificationsEnabled = useMissionsUiStore((s) => s.notificationsEnabled);
  const openPauseSheet = useMissionsUiStore((s) => s.openPauseSheet);
  const closePauseSheet = useMissionsUiStore((s) => s.closePauseSheet);
  const setPauseChoice = useMissionsUiStore((s) => s.setPauseChoice);
  const confirmPause = useMissionsUiStore((s) => s.confirmPause);
  const resume = useMissionsUiStore((s) => s.resume);

  const [board, setBoard] = useState<MissionBoard>(EMPTY_BOARD);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [toast, setToast] = useState(false);
  const previousNewIds = useRef<string[]>([]);
  const paused = isMissionsPaused(pausedUntil);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const next = await fetchMissionBoard();
      const nextIds = next.newMissions.map((item) => item.id);
      if (
        isRefresh &&
        previousNewIds.current.length > 0 &&
        detectNewMissions(previousNewIds.current, nextIds)
      ) {
        setToast(true);
      }
      previousNewIds.current = nextIds;
      setBoard(next);
      setError(null);
      setOffline(false);
    } catch (err) {
      setError(mapApiError(err));
      setOffline(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(false), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const items = missionsForTab(board, tab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
      <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[2] }}>
        <Text
          testID="missions-title"
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.title,
            fontWeight: '700',
            marginBottom: spacing[4],
          }}
        >
          Bonjour
        </Text>
        <View
          style={{
            backgroundColor: colors.neutral[0],
            borderRadius: radius.md,
            padding: spacing[5],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing[3],
          }}
        >
          <Text
            style={{
              flex: 1,
              color: colors.neutral[900],
              fontSize: typography.size.caption,
              fontWeight: '600',
              paddingRight: spacing[3],
            }}
          >
            {paused
              ? 'Missions en pause'
              : 'Disponible pour de nouvelles missions'}
          </Text>
          <KycToggle
            testID="missions-pause-toggle"
            value={!paused}
            onChange={(next) => {
              if (next) {
                resume();
              } else {
                openPauseSheet();
              }
            }}
          />
        </View>
        {offline ? (
          <View
            style={{
              backgroundColor: '#FBF0DD',
              borderRadius: 10,
              padding: spacing[3],
              marginBottom: spacing[3],
            }}
          >
            <Text
              style={{
                color: '#8A5A12',
                fontSize: typography.size.label,
                fontWeight: '600',
              }}
            >
              Connexion instable — les nouvelles missions peuvent être retardées.
            </Text>
          </View>
        ) : null}
        {!notificationsEnabled ? (
          <View
            style={{
              backgroundColor: '#FBF0DD',
              borderRadius: 10,
              padding: spacing[3],
              marginBottom: spacing[3],
            }}
          >
            <Text
              style={{
                color: '#8A5A12',
                fontSize: typography.size.label,
                fontWeight: '600',
              }}
            >
              Notifications désactivées — activez-les pour les nouvelles missions.
            </Text>
          </View>
        ) : null}
        <MissionTabs
          value={tab}
          newCount={board.newMissions.length}
          onChange={setTab}
        />
      </View>

      <View style={{ flex: 1 }}>
        {toast ? (
          <View
            testID="missions-toast"
            style={{
              position: 'absolute',
              top: spacing[3],
              alignSelf: 'center',
              backgroundColor: colors.brand.secondary,
              borderRadius: 10,
              paddingHorizontal: spacing[5],
              paddingVertical: spacing[3],
              zIndex: 2,
            }}
          >
            <Text style={{ color: colors.neutral[0], fontWeight: '600', fontSize: 12 }}>
              Nouvelle mission disponible
            </Text>
          </View>
        ) : null}
        <ScrollView
          testID="missions-list"
          contentContainerStyle={{
            padding: spacing[5],
            gap: spacing[3],
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={colors.brand.primary}
            />
          }
        >
          {error ? <ErrorBanner message={error} /> : null}
          {items.length === 0 ? (
            <Text
              testID="missions-empty"
              style={{
                color: colors.neutral[700],
                fontSize: typography.size.body,
                textAlign: 'center',
                marginTop: spacing[8],
              }}
            >
              Aucune mission pour le moment.
            </Text>
          ) : (
            items.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onPress={() => router.push(`/missions/${mission.id}` as Href)}
              />
            ))
          )}
        </ScrollView>
      </View>

      <PauseSheet
        visible={pauseSheetOpen}
        choice={pauseChoice}
        onChoice={setPauseChoice}
        onConfirm={() => confirmPause()}
        onCancel={closePauseSheet}
      />
    </SafeAreaView>
  );
}
