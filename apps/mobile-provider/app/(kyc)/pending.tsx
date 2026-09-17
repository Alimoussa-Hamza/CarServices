import { useState } from 'react';
import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/button';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { refreshKycStatus } from '../../src/data/kyc';
import { mapApiError } from '../../src/lib/api-errors';
import { syncKycAndResolveRoute } from '../../src/lib/sync-session';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

export default function KycPendingScreen() {
  const { colors, spacing, typography } = useTheme();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRefresh = async () => {
    setError(null);
    setLoading(true);
    try {
      await refreshKycStatus();
      const route = await syncKycAndResolveRoute();
      if (route !== '/(kyc)/pending') {
        router.replace(route as Href);
      }
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

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
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: '#FBF0DD',
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 28 }}>⏳</Text>
      </View>
      <Text
        testID="kyc-pending"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        Dossier en cours de validation
      </Text>
      <Text
        style={{
          color: colors.neutral[700],
          fontSize: typography.size.body,
          textAlign: 'center',
        }}
      >
        Notre équipe vérifie vos informations. Cela prend généralement 24 à 48 h.
      </Text>
      {error ? <ErrorBanner message={error} /> : null}
      <Button testID="kyc-pending-refresh" loading={loading} variant="secondary" onPress={() => void onRefresh()}>
        Actualiser le statut
      </Button>
      <Button
        variant="ghost"
        onPress={() => {
          void clearSession().then(() => router.replace('/(auth)/login'));
        }}
      >
        Se déconnecter
      </Button>
    </SafeAreaView>
  );
}
