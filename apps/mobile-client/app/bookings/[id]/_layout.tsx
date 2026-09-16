import { Stack } from 'expo-router';
import { useTheme } from '../../../src/theme/theme-provider';

export default function BookingIdLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.brand.secondary,
        headerStyle: { backgroundColor: colors.neutral[0] },
        contentStyle: { backgroundColor: colors.neutral[100] },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Suivi' }} />
      <Stack.Screen name="review" options={{ title: 'Votre avis' }} />
    </Stack>
  );
}
