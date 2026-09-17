import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

export default function KycRejectedScreen() {
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
        testID="kyc-rejected"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
        }}
      >
        Dossier refusé
      </Text>
      <Text style={{ color: colors.neutral[700], fontSize: typography.size.body }}>
        Corrigez les documents indiqués puis renvoyez votre dossier.
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
