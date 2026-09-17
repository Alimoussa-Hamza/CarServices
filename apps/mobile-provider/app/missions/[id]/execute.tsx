import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/ui/button';
import { useTheme } from '../../../src/theme/theme-provider';

/** Stub P05 — CS-M12-S07. Checklist + photos 2+2 à l’étape suivante. */
export default function MissionExecuteStubScreen() {
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
        testID="mission-arrived"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
        }}
      >
        Vous êtes arrivé
      </Text>
      <Text style={{ color: colors.neutral[700], fontSize: typography.size.body }}>
        La checklist et les photos avant / après arrivent à l’étape suivante.
      </Text>
      <Button onPress={() => router.replace('/(tabs)/missions' as Href)}>
        Retour aux missions
      </Button>
    </SafeAreaView>
  );
}
