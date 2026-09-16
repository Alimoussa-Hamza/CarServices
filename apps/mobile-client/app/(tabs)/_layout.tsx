import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/theme-provider';

/** C03 / C12 / C13 tab shell */
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.neutral[500],
        headerTintColor: colors.brand.secondary,
        headerStyle: { backgroundColor: colors.neutral[0] },
        tabBarStyle: { backgroundColor: colors.neutral[0] },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarLabel: 'Accueil', headerShown: false }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: 'Réservations', tabBarLabel: 'Réservations', headerShown: false }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarLabel: 'Profil' }}
      />
    </Tabs>
  );
}
