import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/button';
import { enableAndRegisterPush } from '../../src/lib/push-notifications';
import { useNotifPrefsStore } from '../../src/stores/notif-prefs.store';
import { useMissionsUiStore } from '../../src/stores/missions-ui.store';
import { useTheme } from '../../src/theme/theme-provider';

/** Permission push — CS-M12-S11. Autoriser / Plus tard. */
export default function NotificationsPermissionScreen() {
  const { colors, spacing, typography } = useTheme();
  const markPermissionAsked = useNotifPrefsStore((s) => s.markPermissionAsked);
  const setNotificationsEnabled = useMissionsUiStore((s) => s.setNotificationsEnabled);

  const goMissions = () => {
    markPermissionAsked();
    router.replace('/(tabs)/missions' as Href);
  };

  const onAllow = async () => {
    const result = await enableAndRegisterPush();
    setNotificationsEnabled(result.ok);
    goMissions();
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.neutral[100],
        padding: spacing[7],
        justifyContent: 'center',
      }}
    >
      <Text
        testID="notif-permission-title"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
          marginBottom: spacing[3],
        }}
      >
        Ne manquez aucune mission
      </Text>
      <Text style={{ color: colors.neutral[700], marginBottom: spacing[7] }}>
        Autorisez les notifications pour être alerté dès qu’une mission est disponible
        dans votre zone.
      </Text>
      <Button testID="notif-allow" onPress={() => void onAllow()}>
        Autoriser
      </Button>
      <View style={{ height: spacing[3] }} />
      <Button
        variant="ghost"
        testID="notif-later"
        onPress={() => {
          setNotificationsEnabled(false);
          goMissions();
        }}
      >
        Plus tard
      </Button>
    </SafeAreaView>
  );
}
