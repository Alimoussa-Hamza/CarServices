import { Text, View } from 'react-native';
import { useTheme } from '../../src/theme/theme-provider';

/** P08 placeholder — CS-M12-S08 */
export default function GainsScreen() {
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
        Gains
      </Text>
      <Text
        style={{
          color: colors.neutral[700],
          fontSize: typography.size.body,
          marginTop: spacing[3],
        }}
      >
        Solde en transit — bientôt.
      </Text>
    </View>
  );
}
