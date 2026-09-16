import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { bootstrapApiClient } from '../src/data/api-bootstrap';
import { StripeGate } from '../src/lib/stripe-gate';
import { useSecureTokenStore } from '../src/lib/token-storage';
import { useAuthStore } from '../src/stores/auth.store';
import { ThemeProvider, useTheme } from '../src/theme/theme-provider';

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
        <Stack.Screen name="bookings/[id]" options={{ headerShown: true }} />
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
