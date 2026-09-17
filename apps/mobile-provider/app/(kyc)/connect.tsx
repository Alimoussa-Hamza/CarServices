import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

/** Stub jusqu’à CS-M12-S10 — pas de Skip vers les missions. */
export default function ConnectScreen() {
  const { colors, spacing, typography } = useTheme();
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.neutral[100],
        padding: spacing[7],
        justifyContent: 'center',
        gap: spacing[5],
      }}
    >
      <Text
        testID="connect-stub"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
        }}
      >
        Activer les virements
      </Text>
      <Text style={{ color: colors.neutral[700], fontSize: typography.size.body }}>
        Étape obligatoire pour recevoir des missions. L’onboarding Stripe arrive ensuite.
      </Text>
      <Button
        variant="ghost"
        onPress={() => {
          void clearSession().then(() => router.replace('/(auth)/login'));
        }}
      >
        Se déconnecter
      </Button>
    </View>
  );
}
