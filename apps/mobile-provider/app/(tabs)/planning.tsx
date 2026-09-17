import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MissionCard } from '../../src/components/missions/mission-card';
import { PauseSheet } from '../../src/components/missions/pause-sheet';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import {
  chipActive,
  fetchPlanning,
  PLANNING_CHIPS,
  slotsForDay,
  togglePlanningChip,
  weekDates,
  type PlanningModel,
} from '../../src/data/planning';
import { mapApiError } from '../../src/lib/api-errors';
import { WEEK_DAYS } from '../../src/lib/kyc-validation';
import {
  useMissionsUiStore,
} from '../../src/stores/missions-ui.store';
import { useTheme } from '../../src/theme/theme-provider';

const EMPTY: PlanningModel = { weeklySlots: [], upcoming: [] };

/** P07 Planning — CS-M12-S09. Semaine + chips, pas de grille mois. */
export default function PlanningScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(today);
  const [planning, setPlanning] = useState<PlanningModel>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const pauseSheetOpen = useMissionsUiStore((s) => s.pauseSheetOpen);
  const pauseChoice = useMissionsUiStore((s) => s.pauseChoice);
  const openPauseSheet = useMissionsUiStore((s) => s.openPauseSheet);
  const closePauseSheet = useMissionsUiStore((s) => s.closePauseSheet);
  const setPauseChoice = useMissionsUiStore((s) => s.setPauseChoice);
  const confirmPause = useMissionsUiStore((s) => s.confirmPause);

  const load = useCallback(async () => {
    try {
      setPlanning(await fetchPlanning());
      setError(null);
    } catch (err) {
      setError(mapApiError(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const days = weekDates().map((day) => ({
    ...day,
    available: slotsForDay(planning.weeklySlots, day.dayOfWeek).length > 0,
  }));
  const selectedMeta = WEEK_DAYS.find((day) => day.key === selectedDay);
  const slotCount = slotsForDay(planning.weeklySlots, selectedDay).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[100] }} edges={['bottom']}>
      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingTop: spacing[2],
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          testID="planning-title"
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.title,
            fontWeight: '700',
          }}
        >
          Planning
        </Text>
        <Pressable
          testID="planning-pause"
          onPress={openPauseSheet}
          style={{
            minHeight: 36,
            paddingHorizontal: spacing[4],
            borderRadius: 99,
            borderWidth: 2,
            borderColor: colors.neutral[300],
            backgroundColor: colors.neutral[0],
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.neutral[900], fontWeight: '700', fontSize: 12 }}>
            Pause aujourd’hui
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5] }}>
        {error ? <ErrorBanner message={error} /> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {days.map((day) => {
            const selected = day.dayOfWeek === selectedDay;
            return (
              <Pressable
                key={day.dayOfWeek}
                testID={`planning-day-${day.dayOfWeek}`}
                onPress={() => setSelectedDay(day.dayOfWeek)}
                style={{ alignItems: 'center', flex: 1, gap: 6 }}
              >
                <Text
                  style={{
                    color: day.available ? colors.neutral[700] : colors.neutral[300],
                    fontSize: 10,
                    fontWeight: '600',
                  }}
                >
                  {day.label}
                </Text>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: selected ? colors.brand.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: selected
                        ? colors.neutral[0]
                        : day.available
                          ? colors.neutral[900]
                          : colors.neutral[300],
                      fontWeight: '700',
                    }}
                  >
                    {day.date}
                  </Text>
                </View>
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: day.available ? colors.brand.primary : 'transparent',
                  }}
                />
              </Pressable>
            );
          })}
        </View>

        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[3] }}>
            <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>
              {selectedMeta?.label}
            </Text>
            <Text style={{ color: colors.neutral[700], fontSize: typography.size.label }}>
              {slotCount} créneau{slotCount > 1 ? 'x' : ''} disponible{slotCount > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {PLANNING_CHIPS.map((chip) => {
              const active = chipActive(planning.weeklySlots, selectedDay, chip);
              return (
                <Pressable
                  key={chip.label}
                  testID={`planning-chip-${selectedDay}-${chip.startTime}`}
                  onPress={() =>
                    void togglePlanningChip(planning, selectedDay, chip).then(setPlanning)
                  }
                  style={{
                    minHeight: 40,
                    paddingHorizontal: spacing[4],
                    borderRadius: 8,
                    backgroundColor: active ? colors.brand.primary : colors.neutral[0],
                    borderWidth: 2,
                    borderColor: active ? colors.brand.primary : colors.neutral[300],
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: active ? colors.neutral[0] : colors.neutral[700],
                      fontWeight: '600',
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={{ color: colors.neutral[900], fontWeight: '700', marginBottom: spacing[3] }}>
            Missions planifiées
          </Text>
          {planning.upcoming.length === 0 ? (
            <Text
              testID="planning-empty"
              style={{ color: colors.neutral[700], textAlign: 'center' }}
            >
              Aucune mission planifiée.
            </Text>
          ) : (
            planning.upcoming.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onPress={() =>
                  router.push(`/missions/${mission.id}/active` as Href)
                }
              />
            ))
          )}
        </View>
      </ScrollView>

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
