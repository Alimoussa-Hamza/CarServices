import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../theme/theme-provider';

export type BookingsSegment = 'upcoming' | 'past' | 'cancelled';

export type BookingsSegmentControlProps = {
  value: BookingsSegment;
  onChange: (value: BookingsSegment) => void;
  testID?: string;
};

const SEGMENTS: { value: BookingsSegment; label: string }[] = [
  { value: 'upcoming', label: 'À venir' },
  { value: 'past', label: 'Passées' },
  { value: 'cancelled', label: 'Annulées' },
];

export function BookingsSegmentControl({
  value,
  onChange,
  testID,
}: BookingsSegmentControlProps) {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        backgroundColor: colors.neutral[0],
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.neutral[300],
        padding: spacing[2],
        gap: spacing[2],
      }}
    >
      {SEGMENTS.map((segment) => {
        const active = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            testID={`bookings-segment-${segment.value}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(segment.value)}
            style={{
              flex: 1,
              paddingVertical: spacing[3],
              borderRadius: radius.sm,
              backgroundColor: active ? colors.brand.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: typography.size.caption,
                fontWeight: active ? '700' : '500',
                color: active ? colors.neutral[0] : colors.neutral[700],
              }}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
