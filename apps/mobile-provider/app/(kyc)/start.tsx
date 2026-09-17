import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

type KycStubProps = {
  title: string;
  body: string;
  testID: string;
};

function KycStub({ title, body, testID }: KycStubProps) {
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
        testID={testID}
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
        }}
      >
        {title}
      </Text>
      <Text style={{ color: colors.neutral[700], fontSize: typography.size.body }}>
        {body}
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

export default function KycStartScreen() {
  return (
    <KycStub
      testID="kyc-start"
      title="Dossier en cours de création"
      body="Complétez les 7 étapes KYC pour recevoir des missions. L’assistant arrive à l’étape suivante."
    />
  );
}
