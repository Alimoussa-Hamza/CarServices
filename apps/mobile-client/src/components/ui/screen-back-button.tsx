import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { goBackOr } from '../../lib/navigation';
import { useTheme } from '../../theme/theme-provider';

export type ScreenBackButtonProps = {
  fallback?: Href;
  testID?: string;
};

/** Explicit back for nested stacks that have no parent history (e.g. C10 from tabs). */
export function ScreenBackButton({
  fallback = '/(tabs)',
  testID = 'screen-back',
}: ScreenBackButtonProps) {
  const { colors, spacing } = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Retour"
      hitSlop={12}
      onPress={() => goBackOr(fallback)}
      style={{ paddingHorizontal: spacing[2], marginLeft: -spacing[2] }}
    >
      <Ionicons name="chevron-back" size={28} color={colors.brand.secondary} />
    </Pressable>
  );
}
