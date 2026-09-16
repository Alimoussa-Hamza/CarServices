import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { useTheme } from '../../src/theme/theme-provider';

/** C04 Catalogue — stub until CS-M11-S04 */
export default function CatalogStubScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        padding: spacing[7],
        backgroundColor: colors.neutral[100],
        justifyContent: 'center',
        gap: spacing[5],
      }}
    >
      <Text
        style={{
          fontSize: typography.size.title,
          fontWeight: '700',
          color: colors.neutral[900],
        }}
      >
        Catalogue
      </Text>
      <Text style={{ color: colors.neutral[700], fontSize: typography.size.body }}>
        Parcours réservation C04–C07 arrive dans la prochaine story (CS-M11-S04).
      </Text>
      <Button variant="secondary" onPress={() => router.back()}>
        Retour
      </Button>
    </View>
  );
}
