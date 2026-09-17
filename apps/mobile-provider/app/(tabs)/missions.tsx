import { Text, View } from 'react-native';
import { useTheme } from '../../src/theme/theme-provider';

/** P02 placeholder — liste réelle = CS-M12-S04 */
export default function MissionsScreen() {
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
        testID="missions-placeholder"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
        }}
      >
        Missions
      </Text>
      <Text
        style={{
          color: colors.neutral[700],
          fontSize: typography.size.body,
          marginTop: spacing[3],
        }}
      >
        Nouvelles, à venir et en cours — bientôt.
      </Text>
    </View>
  );
}
