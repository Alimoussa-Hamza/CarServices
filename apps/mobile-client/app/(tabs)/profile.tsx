import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

/** C13 Profil — stub until CS-M11-S10 (+ logout S02) */
export default function ProfileScreen() {
  const { colors, spacing, typography } = useTheme();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <View style={{ flex: 1, padding: spacing[7], backgroundColor: colors.neutral[100], gap: spacing[4] }}>
      <Text style={{ fontSize: typography.size.title, color: colors.neutral[900], fontWeight: '700' }}>
        Profil
      </Text>
      <Text style={{ color: colors.neutral[700] }}>
        {user ? `Connecté · ${user.phone}` : 'Non connecté'}
      </Text>
      {user ? (
        <Button
          variant="destructive"
          testID="profile-logout"
          onPress={async () => {
            await clearSession();
            router.replace('/(auth)/login');
          }}
        >
          Se déconnecter
        </Button>
      ) : (
        <Button onPress={() => router.push('/(auth)/login')}>Se connecter</Button>
      )}
    </View>
  );
}
