import { useState } from 'react';
import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/button';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { applyConnectSuccess, startConnectOnboarding } from '../../src/data/connect';
import { mapApiError } from '../../src/lib/api-errors';
import { openStripeConnectBrowser } from '../../src/lib/stripe-connect';
import { syncKycAndResolveRoute } from '../../src/lib/sync-session';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

const BENEFITS = [
  'Virements automatiques après chaque mission',
  'Suivi de vos gains en temps réel',
  'Aucune commission cachée',
];

/** P00 Connect — CS-M12-S10. Pas de Skip vers les missions. */
export default function ConnectScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onActivate = async () => {
    setError(null);
    setLoading(true);
    try {
      const link = await startConnectOnboarding();
      const outcome = await openStripeConnectBrowser(link.url);
      if (outcome === 'success') {
        await applyConnectSuccess();
      }
      const route = await syncKycAndResolveRoute();
      if (route !== '/(kyc)/connect') {
        router.replace(route as Href);
        return;
      }
      if (outcome === 'cancel') {
        setError('Onboarding incomplet. Reprenez pour activer les virements.');
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
        paddingHorizontal: spacing[5],
        paddingTop: spacing[4],
      }}
    >
      <View
        style={{
          backgroundColor: '#E9F5EE',
          borderRadius: radius.md,
          padding: spacing[5],
          marginBottom: spacing[5],
        }}
      >
        <Text
          style={{
            color: colors.neutral[900],
            fontWeight: '700',
            fontSize: typography.size.caption,
          }}
        >
          Dossier validé !
        </Text>
        <Text style={{ color: colors.neutral[700], fontSize: typography.size.label }}>
          Bienvenue chez CarWash Pro.
        </Text>
      </View>

      <Text
        testID="connect-title"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
          marginBottom: spacing[2],
        }}
      >
        Activez vos virements
      </Text>
      <Text
        style={{
          color: colors.neutral[700],
          fontSize: typography.size.caption,
          marginBottom: spacing[5],
        }}
      >
        Pour être payé après chaque mission, connectez vos coordonnées bancaires
        en toute sécurité.
      </Text>

      <View
        style={{
          backgroundColor: colors.neutral[0],
          borderRadius: radius.lg,
          padding: spacing[7],
          alignItems: 'center',
          marginBottom: spacing[5],
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.brand.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing[3],
          }}
        >
          <Text style={{ color: colors.brand.primary, fontWeight: '800', fontSize: 20 }}>
            €
          </Text>
        </View>
        <Text
          style={{
            color: colors.neutral[900],
            fontWeight: '700',
            marginBottom: spacing[2],
          }}
        >
          Paiement sécurisé
        </Text>
        <Text
          style={{
            color: colors.neutral[700],
            fontSize: typography.size.label,
            textAlign: 'center',
          }}
        >
          Vos informations bancaires sont chiffrées et gérées par Stripe. CarWash
          Pro n’a jamais accès à votre IBAN complet.
        </Text>
      </View>

      <View style={{ gap: spacing[3], flex: 1 }}>
        {BENEFITS.map((line) => (
          <Text
            key={line}
            style={{ color: colors.neutral[900], fontSize: typography.size.caption }}
          >
            {`✓  ${line}`}
          </Text>
        ))}
      </View>

      {error ? <ErrorBanner message={error} testID="connect-error" /> : null}

      <View style={{ paddingVertical: spacing[4], gap: spacing[3] }}>
        <Button
          testID="connect-activate"
          loading={loading}
          onPress={() => void onActivate()}
        >
          Activer les virements
        </Button>
        <Text
          style={{
            color: colors.neutral[500],
            fontSize: typography.size.label,
            textAlign: 'center',
          }}
        >
          Étape obligatoire pour recevoir des missions.
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
    </SafeAreaView>
  );
}
