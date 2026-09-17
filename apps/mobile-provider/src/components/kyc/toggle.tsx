import { Pressable, View } from 'react-native';
import { useTheme } from '../../theme/theme-provider';

export type KycToggleProps = {
  value: boolean;
  onChange: (next: boolean) => void;
  testID?: string;
};

export function KycToggle({ value, onChange, testID }: KycToggleProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      testID={testID}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: value ? colors.semantic.success : colors.neutral[300],
        justifyContent: 'center',
        paddingHorizontal: 2,
        alignItems: value ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={{
          width: 21,
          height: 21,
          borderRadius: 11,
          backgroundColor: colors.neutral[0],
        }}
      />
    </Pressable>
  );
}
