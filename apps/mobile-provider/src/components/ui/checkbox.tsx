import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../theme/theme-provider';

export type CheckboxProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  testID?: string;
};

export function Checkbox({ checked, onChange, label, testID }: CheckboxProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      testID={testID}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.sm,
          borderWidth: 2,
          borderColor: checked ? colors.brand.primary : colors.neutral[300],
          backgroundColor: checked ? colors.brand.primary : colors.neutral[0],
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        {checked ? (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: colors.neutral[0],
            }}
          />
        ) : null}
      </View>
      <Text
        style={{
          flex: 1,
          color: colors.neutral[700],
          fontSize: typography.size.caption,
          lineHeight: typography.lineHeight.caption,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
