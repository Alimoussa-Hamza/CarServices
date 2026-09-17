import { Pressable, Text, View } from 'react-native';
import type { MissionTab } from '../../data/missions';
import { useTheme } from '../../theme/theme-provider';

const TABS: { id: MissionTab; label: string }[] = [
  { id: 'new', label: 'Nouvelles' },
  { id: 'upcoming', label: 'À venir' },
  { id: 'active', label: 'En cours' },
];

export type MissionTabsProps = {
  value: MissionTab;
  newCount: number;
  onChange: (tab: MissionTab) => void;
};

export function MissionTabs({ value, newCount, onChange }: MissionTabsProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View
      testID="missions-tabs"
      style={{
        backgroundColor: '#EDF0F3',
        borderRadius: radius.md,
        padding: 4,
        flexDirection: 'row',
        gap: 4,
      }}
    >
      {TABS.map((tab) => {
        const active = value === tab.id;
        return (
          <Pressable
            key={tab.id}
            testID={`missions-tab-${tab.id}`}
            onPress={() => onChange(tab.id)}
            style={{
              flex: 1,
              height: 36,
              borderRadius: radius.sm,
              backgroundColor: active ? colors.brand.secondary : 'transparent',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
            }}
          >
            <Text
              style={{
                color: active ? colors.neutral[0] : colors.neutral[500],
                fontSize: typography.size.caption,
                fontWeight: '600',
              }}
            >
              {tab.label}
            </Text>
            {tab.id === 'new' && newCount > 0 ? (
              <View
                style={{
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: colors.brand.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    color: colors.neutral[0],
                    fontSize: 10,
                    fontWeight: '700',
                  }}
                >
                  {newCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
