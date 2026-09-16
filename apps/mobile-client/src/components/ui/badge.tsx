import { Text, View } from 'react-native';
import { useTheme } from '../../theme/theme-provider';

export type BadgeProps = {
  label: string;
  tone?: 'brand' | 'success' | 'neutral' | 'warning';
  testID?: string;
};

export function Badge({ label, tone = 'brand', testID }: BadgeProps) {
  const { colors, radius, spacing, typography } = useTheme();

  const bg =
    tone === 'success'
      ? colors.brand.primaryLight
      : tone === 'neutral'
        ? colors.neutral[100]
        : tone === 'warning'
          ? '#FDF2E9'
          : colors.brand.primaryLight;
  const fg =
    tone === 'success'
      ? colors.semantic.success
      : tone === 'neutral'
        ? colors.neutral[700]
        : tone === 'warning'
          ? colors.semantic.warning
          : colors.brand.primary;

  return (
    <View
      testID={testID}
      style={{
        alignSelf: 'flex-start',
        backgroundColor: bg,
        borderRadius: radius.full,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
      }}
    >
      <Text style={{ color: fg, fontSize: typography.size.label, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}
