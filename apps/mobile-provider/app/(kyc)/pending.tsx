import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

export default function KycPendingScreen() {
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
        testID="kyc-pending"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
        }}
      >
        Dossier en cours de validation
      </Text>
      <Text style={{ color: colors.neutral[700], fontSize: typography.size.body }}>
        Notre équipe vérifie vos informations. Cela prend généralement 24 à 48 h.
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
