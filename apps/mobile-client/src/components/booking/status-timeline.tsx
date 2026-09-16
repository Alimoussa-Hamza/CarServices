import { View, Text } from 'react-native';
import type { ClientTimelineStep } from '../../lib/booking-timeline';
import { formatTimeFr } from '../../lib/format';
import { useTheme } from '../../theme/theme-provider';

export type StatusTimelineProps = {
  steps: ClientTimelineStep[];
  testID?: string;
};

export function StatusTimeline({ steps, testID }: StatusTimelineProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View testID={testID} style={{ gap: spacing[4] }}>
      <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>Timeline</Text>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const dotColor =
          step.state === 'done'
            ? colors.brand.primary
            : step.state === 'current'
              ? colors.brand.secondary
              : colors.neutral[300];
        return (
          <View key={step.key} style={{ flexDirection: 'row', gap: spacing[4] }}>
            <View style={{ alignItems: 'center', width: 16 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: dotColor,
                  borderWidth: step.state === 'current' ? 2 : 0,
                  borderColor: colors.brand.primaryLight,
                }}
              />
              {!isLast ? (
                <View
                  style={{
                    flex: 1,
                    width: 2,
                    minHeight: 20,
                    marginTop: spacing[2],
                    backgroundColor:
                      step.state === 'done' ? colors.brand.primaryLight : colors.neutral[300],
                  }}
                />
              ) : null}
            </View>
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : spacing[2] }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: spacing[3],
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color:
                      step.state === 'upcoming' ? colors.neutral[500] : colors.neutral[900],
                    fontWeight: step.state === 'current' ? '700' : '500',
                    fontSize: typography.size.body,
                  }}
                >
                  {step.label}
                </Text>
                {step.at ? (
                  <Text style={{ color: colors.neutral[500], fontSize: typography.size.caption }}>
                    {formatTimeFr(step.at)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
