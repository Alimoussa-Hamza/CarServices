import { Text, View } from 'react-native';
import { useTheme } from '../../src/theme/theme-provider';

/** P09 placeholder — profil / notifs = stories suivantes */
export default function ProfilScreen() {
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
        Profil
      </Text>
      <Text
        style={{
          color: colors.neutral[700],
          fontSize: typography.size.body,
          marginTop: spacing[3],
        }}
      >
        Compte, RC Pro, notifications — bientôt.
      </Text>
    </View>
  );
}
