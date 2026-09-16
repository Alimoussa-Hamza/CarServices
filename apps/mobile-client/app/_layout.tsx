import 'react-native-gesture-handler';
import { useEffect, type ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import { bootstrapApiClient } from '../src/data/api-bootstrap';
import { env } from '../src/config/env';
import { useSecureTokenStore } from '../src/lib/token-storage';
import { useAuthStore } from '../src/stores/auth.store';
import { ThemeProvider, useTheme } from '../src/theme/theme-provider';

function StripeGate({ children }: { children: ReactElement | ReactElement[] }) {
  if (!env.stripePublishableKey) {
    return <>{children}</>;
  }
  return (
    <StripeProvider publishableKey={env.stripePublishableKey}>{children}</StripeProvider>
  );
}

function RootNavigator() {
  const { colors } = useTheme();
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    useSecureTokenStore();
    bootstrapApiClient();
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.brand.primary }]}>
        <ActivityIndicator color={colors.neutral[0]} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.neutral[100] },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)/login" options={{ presentation: 'card' }} />
        <Stack.Screen name="book" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StripeGate>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </StripeGate>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
