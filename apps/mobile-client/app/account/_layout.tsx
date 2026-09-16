import { Stack } from 'expo-router';
import { ScreenBackButton } from '../../src/components/ui/screen-back-button';
import { useTheme } from '../../src/theme/theme-provider';

export default function AccountLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.brand.secondary,
        headerStyle: { backgroundColor: colors.neutral[0] },
        contentStyle: { backgroundColor: colors.neutral[100] },
        headerBackVisible: false,
        headerLeft: () => <ScreenBackButton fallback="/(tabs)/profile" />,
      }}
    >
      <Stack.Screen name="edit" options={{ title: 'Modifier le profil' }} />
      <Stack.Screen name="addresses" options={{ title: 'Mes adresses' }} />
    </Stack>
  );
}
