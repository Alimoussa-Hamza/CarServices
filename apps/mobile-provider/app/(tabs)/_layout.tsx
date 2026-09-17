import { useEffect } from 'react';
import { Tabs, router, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PRO_TABS } from '../../src/navigation/tabs';
import { resolveSessionRoute } from '../../src/lib/session-gate';
import { syncKycAndResolveRoute } from '../../src/lib/sync-session';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

const TAB_ICONS = {
  missions: 'list' as const,
  planning: 'calendar-outline' as const,
  gains: 'wallet-outline' as const,
  profil: 'person-outline' as const,
};

export default function TabsLayout() {
  const { colors } = useTheme();
  const accessToken = useAuthStore((s) => s.accessToken);
  const kycStatus = useAuthStore((s) => s.kycStatus);
  const chargesEnabled = useAuthStore((s) => s.chargesEnabled);

  useEffect(() => {
    const current = resolveSessionRoute({
      authenticated: Boolean(accessToken),
      kycStatus,
      chargesEnabled,
    });
    if (current !== '/(tabs)/missions') {
      void syncKycAndResolveRoute().then((route) => {
        if (route !== '/(tabs)/missions') {
          router.replace(route as Href);
        }
      });
    }
  }, [accessToken, kycStatus, chargesEnabled]);

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
      {PRO_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            headerShown: false,
            title: tab.label,
            tabBarLabel: tab.label,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS[tab.name]} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
