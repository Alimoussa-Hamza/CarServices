import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/theme-provider';

export default function BookLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.brand.secondary,
        contentStyle: { backgroundColor: colors.neutral[100] },
        headerStyle: { backgroundColor: colors.neutral[0] },
      }}
    >
      <Stack.Screen name="catalog" options={{ title: 'Formule' }} />
      <Stack.Screen name="config" options={{ title: 'Personnaliser' }} />
      <Stack.Screen name="address" options={{ title: 'Adresse' }} />
      <Stack.Screen name="out-of-zone" options={{ title: 'Hors zone' }} />
      <Stack.Screen name="slot" options={{ title: 'Créneau' }} />
      <Stack.Screen name="pay" options={{ title: 'Paiement' }} />
      <Stack.Screen name="confirm" options={{ title: 'Confirmation', headerBackVisible: false }} />
    </Stack>
  );
}
