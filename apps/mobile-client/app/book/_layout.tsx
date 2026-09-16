import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/theme-provider';

export default function BookLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.brand.secondary,
        contentStyle: { backgroundColor: colors.neutral[100] },
      }}
    >
      <Stack.Screen name="catalog" options={{ title: 'Formules' }} />
    </Stack>
  );
}
