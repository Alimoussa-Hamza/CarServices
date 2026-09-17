import { Text, View } from 'react-native';
import { useTheme } from '../../src/theme/theme-provider';

/** P07 placeholder — CS-M12-S09 */
export default function PlanningScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.neutral[100],
        padding: spacing[7],
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
        }}
      >
        Planning
      </Text>
      <Text
        style={{
          color: colors.neutral[700],
          fontSize: typography.size.body,
          marginTop: spacing[3],
        }}
      >
        Semaine et créneaux — bientôt.
      </Text>
    </View>
  );
}
