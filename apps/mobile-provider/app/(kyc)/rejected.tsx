import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/button';
import { fetchKycGate } from '../../src/data/kyc';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

const DEFAULT_REASON = 'Document RC Pro illisible';

export default function KycRejectedScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [reason, setReason] = useState(DEFAULT_REASON);

  useEffect(() => {
    void fetchKycGate().then((gate) => {
      if (gate.rejectionReason) {
        setReason(gate.rejectionReason);
      }
    });
  }, []);

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
          backgroundColor: '#FBEAEA',
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 28 }}>!</Text>
      </View>
      <Text
        testID="kyc-rejected"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        Dossier refusé
      </Text>
      <Text
        style={{
          color: colors.neutral[700],
          fontSize: typography.size.body,
          textAlign: 'center',
        }}
      >
        Votre dossier n’a pas pu être validé pour le motif suivant :
      </Text>
      <View
        style={{
          backgroundColor: colors.neutral[0],
          borderRadius: radius.md,
          borderLeftWidth: 4,
          borderLeftColor: colors.semantic.error,
          padding: spacing[5],
        }}
      >
        <Text
          testID="kyc-rejected-reason"
          style={{
            color: colors.neutral[900],
            fontWeight: '700',
            marginBottom: spacing[2],
          }}
        >
          {reason}
        </Text>
        <Text style={{ color: colors.neutral[700], fontSize: typography.size.caption }}>
          L’attestation d’assurance fournie est trop floue ou incomplète. Merci
          d’en envoyer une version lisible et à jour.
        </Text>
      </View>
      <Button
        testID="kyc-rejected-fix"
        onPress={() => router.replace('/(kyc)/wizard/1' as Href)}
      >
        Corriger mon dossier
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
