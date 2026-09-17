import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { env } from '../src/config/env';
import { getHealthStatus } from '../src/data/health';
import { syncKycAndResolveRoute } from '../src/lib/sync-session';
import { useTheme } from '../src/theme/theme-provider';

/** P00 Splash — CS-M12-S01 / S02 */
export default function SplashScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const [status, setStatus] = useState('…');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getHealthStatus().then((res) => setStatus(res.label));
  }, []);

  const onContinue = async () => {
    setBusy(true);
    try {
      const route = await syncKycAndResolveRoute();
      router.replace(route as Href);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.neutral[100], padding: spacing[7] },
      ]}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: radius.lg,
          backgroundColor: colors.brand.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: colors.neutral[0],
            fontSize: 24,
            fontWeight: '800',
          }}
        >
          CW
        </Text>
      </View>
      <Text
        testID="splash-title"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
          marginTop: spacing[5],
        }}
      >
        CarWash Pro
      </Text>
      <Text
        style={{
          color: colors.neutral[700],
          fontSize: typography.size.body,
          marginTop: spacing[3],
          textAlign: 'center',
        }}
      >
        L'app des pros du lavage mobile
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
          testID="splash-health-status"
          style={{
            color: colors.brand.primary,
            fontSize: typography.size.body,
            fontWeight: '600',
          }}
        >
          {status}
        </Text>
      </View>

      <Pressable
        testID="splash-enter-tabs"
        disabled={busy}
        onPress={() => void onContinue()}
        style={{
          marginTop: spacing[8],
          backgroundColor: colors.brand.primary,
          paddingVertical: spacing[5],
          paddingHorizontal: spacing[8],
          borderRadius: radius.md,
          minHeight: 52,
          minWidth: 220,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: busy ? 0.7 : 1,
        }}
      >
        <Text
          style={{
            color: colors.neutral[0],
            fontSize: typography.size.body,
            fontWeight: '700',
          }}
        >
          Continuer
        </Text>
      </Pressable>

      <StatusBar style="dark" />
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
