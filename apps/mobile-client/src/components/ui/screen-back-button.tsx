import { Pressable, Text } from 'react-native';
import type { Href } from 'expo-router';
import { goBackOr } from '../../lib/navigation';
import { useTheme } from '../../theme/theme-provider';

export type ScreenBackButtonProps = {
  fallback?: Href;
  testID?: string;
};

/**
 * Explicit back for nested stacks without parent history (e.g. C10 from tabs).
 * Plain Text (not @expo/vector-icons) — Ionicons breaks in native stack headers
 * under Expo Go / bridgeless ("useContext of null").
 */
export function ScreenBackButton({
  fallback = '/(tabs)',
  testID = 'screen-back',
}: ScreenBackButtonProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Retour"
      hitSlop={12}
      onPress={() => goBackOr(fallback)}
      style={{
        paddingHorizontal: spacing[2],
        marginLeft: -spacing[2],
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: colors.brand.secondary,
          fontSize: typography.size.title,
          fontWeight: '600',
          lineHeight: 28,
        }}
      >
        ‹
      </Text>
    </Pressable>
  );
}
