import { Pressable, Text, View } from 'react-native';
import type { MissionCardModel } from '../../data/missions';
import { useTheme } from '../../theme/theme-provider';

export function MissionCard({
  mission,
  onPress,
}: {
  mission: MissionCardModel;
  onPress?: () => void;
}) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <Pressable
      testID={`mission-card-${mission.id}`}
      onPress={onPress}
      disabled={!onPress}
      style={{
        backgroundColor: colors.neutral[0],
        borderRadius: radius.md,
        padding: spacing[5],
        gap: spacing[3],
      }}
    >
      {mission.inProgress ? (
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: colors.brand.primaryLight,
            borderRadius: 99,
            paddingHorizontal: spacing[3],
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              color: colors.brand.primary,
              fontSize: typography.size.label,
              fontWeight: '700',
            }}
          >
            Mission en cours
          </Text>
        </View>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.body,
            fontWeight: '700',
          }}
        >
          {mission.offerName}
        </Text>
        <Text
          testID={`mission-net-${mission.id}`}
          style={{
            color: colors.brand.primary,
            fontSize: typography.size.body,
            fontWeight: '700',
          }}
        >
          {mission.netLabel}
        </Text>
      </View>
      <Text style={{ color: colors.neutral[700], fontSize: typography.size.caption }}>
        {mission.quartier}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: colors.neutral[700],
            fontSize: typography.size.caption,
            fontWeight: '600',
          }}
        >
          {mission.slotLabel}
        </Text>
        <View
          style={{
            backgroundColor: '#F0F2F4',
            borderRadius: 99,
            paddingHorizontal: spacing[3],
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              color: colors.neutral[900],
              fontSize: typography.size.label,
              fontWeight: '600',
            }}
          >
            {mission.durationLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
