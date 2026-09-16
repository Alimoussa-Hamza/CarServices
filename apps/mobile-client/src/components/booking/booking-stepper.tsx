import { View, Text } from 'react-native';
import { useTheme } from '../../theme/theme-provider';

const STEPS = ['Formule', 'Config', 'Adresse', 'Créneau'] as const;

export type BookingStepperProps = {
  /** 0-based step index */
  current: number;
};

export function BookingStepper({ current }: BookingStepperProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[3],
        backgroundColor: colors.neutral[0],
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral[300],
      }}
      testID="booking-stepper"
    >
      {STEPS.map((label, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <View key={label} style={{ alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  active || done ? colors.brand.primary : colors.neutral[300],
                marginBottom: spacing[2],
              }}
            />
            <Text
              style={{
                fontSize: typography.size.label,
                color: active ? colors.brand.primary : colors.neutral[500],
                fontWeight: active ? '700' : '500',
              }}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
