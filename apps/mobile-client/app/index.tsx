import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../src/components/ui/button';
import { ErrorBanner } from '../src/components/ui/error-banner';
import { env } from '../src/config/env';
import { getHealthStatus } from '../src/data/health';
import { selectIsAuthenticated, useAuthStore } from '../src/stores/auth.store';
import { useTheme } from '../src/theme/theme-provider';

/**
 * Splash / bootstrap — PDF Splash
 * Shows API or mock readiness; redirects if already authenticated.
 */
export default function SplashScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [status, setStatus] = useState('…');
  const [source, setSource] = useState<'mock' | 'api' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    setStatus('…');
    getHealthStatus()
      .then((res) => {
        setStatus(res.label);
        setSource(res.source);
      })
      .catch(() => {
        setError('Impossible de vérifier le statut.');
        setStatus('erreur');
      });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  return (
    <View style={[styles.container, { backgroundColor: colors.brand.primary, padding: spacing[7] }]}>
      <Text
        style={{
          color: colors.neutral[0],
          fontSize: typography.size.display,
          lineHeight: typography.lineHeight.display,
          fontWeight: '700',
          fontFamily: typography.fontFamily.display,
        }}
      >
        CarWash
      </Text>
      <Text
        style={{
          color: colors.neutral[0],
          opacity: 0.9,
          marginTop: spacing[3],
          fontSize: typography.size.body,
        }}
      >
        Lavage auto à domicile, éco et assuré
      </Text>

      <View
        style={{
          marginTop: spacing[8],
          backgroundColor: colors.neutral[0],
          borderRadius: radius.md,
          padding: spacing[7],
          minWidth: 220,
          alignItems: 'center',
          gap: spacing[3],
        }}
      >
        <Text style={{ color: colors.neutral[700], fontSize: typography.size.caption }}>
          {env.useMocks ? 'Mode mock' : 'Mode API'}
        </Text>
        <Text
          style={{
            color: colors.brand.primary,
            fontSize: typography.size.title,
            fontWeight: '600',
          }}
          testID="splash-health-status"
        >
          {status}
        </Text>
        {source ? (
          <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
            source: {source}
          </Text>
        ) : null}
      </View>

      {error ? (
        <View style={{ marginTop: spacing[5], width: '100%', maxWidth: 320 }}>
          <ErrorBanner message={error} onAction={load} testID="splash-error" />
        </View>
      ) : null}

      <View style={{ marginTop: spacing[8], width: '100%', maxWidth: 320, gap: spacing[4] }}>
        <Link href="/(tabs)" asChild>
          <Button testID="splash-enter-tabs">Entrer dans l’app</Button>
        </Link>
        <Link href="/(auth)/login" asChild>
          <Button variant="secondary" testID="splash-go-auth">
            Connexion (OTP)
          </Button>
        </Link>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
