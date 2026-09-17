import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/ui/button';
import { useTheme } from '../../../src/theme/theme-provider';

/** Stub P04 — CS-M12-S06. Adresse complète ici à l’étape suivante. */
export default function MissionActiveStubScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.neutral[100],
        padding: spacing[7],
        justifyContent: 'center',
        gap: spacing[5],
      }}
    >
      <Text
        testID="mission-accepted"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
        }}
      >
        Mission acceptée
      </Text>
      <Text style={{ color: colors.neutral[700], fontSize: typography.size.body }}>
        L’adresse exacte est débloquée. L’écran En route arrive à l’étape suivante.
      </Text>
      <Button onPress={() => router.replace('/(tabs)/missions' as Href)}>
        Retour aux missions
      </Button>
    </SafeAreaView>
  );
}
