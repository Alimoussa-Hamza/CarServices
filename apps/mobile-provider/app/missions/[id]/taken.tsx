import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/ui/button';
import { useTheme } from '../../../src/theme/theme-provider';

/** P03e — un autre pro a accepté (RG-MATCH premier arrivé). */
export default function MissionTakenScreen() {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.neutral[100],
        padding: spacing[7],
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: '#F0F2F4',
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing[5],
        }}
      >
        <Text style={{ fontSize: 28 }}>…</Text>
      </View>
      <Text
        testID="mission-taken-title"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: spacing[3],
        }}
      >
        Cette mission n’est plus disponible
      </Text>
      <Text
        style={{
          color: colors.neutral[700],
          fontSize: typography.size.body,
          textAlign: 'center',
          marginBottom: spacing[5],
        }}
      >
        Un autre professionnel l’a acceptée avant vous. De nouvelles missions
        arrivent régulièrement.
      </Text>
      <View
        style={{
          backgroundColor: colors.neutral[0],
          borderRadius: radius.md,
          padding: spacing[5],
          marginBottom: spacing[7],
        }}
      >
        <Text style={{ color: colors.neutral[700], fontSize: typography.size.caption }}>
          Astuce : activez les notifications pour être alerté plus vite.
        </Text>
      </View>
      <Button
        testID="mission-taken-back"
        onPress={() => router.replace('/(tabs)/missions' as Href)}
      >
        Voir d’autres missions
      </Button>
    </SafeAreaView>
  );
}
