import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KycToggle } from '../../src/components/kyc/toggle';
import { playMissionPing } from '../../src/lib/push-notifications';
import { useNotifPrefsStore } from '../../src/stores/notif-prefs.store';
import { useTheme } from '../../src/theme/theme-provider';

/** P09b Toggles — CS-M12-S11 */
export default function NotifsScreen() {
  const { colors, spacing, typography } = useTheme();
  const newMissions = useNotifPrefsStore((s) => s.newMissions);
  const sound = useNotifPrefsStore((s) => s.sound);
  const reminderH1 = useNotifPrefsStore((s) => s.reminderH1);
  const account = useNotifPrefsStore((s) => s.account);
  const setNewMissions = useNotifPrefsStore((s) => s.setNewMissions);
  const setSound = useNotifPrefsStore((s) => s.setSound);
  const setReminderH1 = useNotifPrefsStore((s) => s.setReminderH1);
  const setAccount = useNotifPrefsStore((s) => s.setAccount);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing[5],
          paddingVertical: spacing[3],
        }}
      >
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[900]} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            color: colors.neutral[900],
            fontWeight: '700',
            marginRight: 36,
          }}
        >
          Notifications
        </Text>
      </View>
      <View
        style={{
          margin: spacing[5],
          backgroundColor: colors.neutral[0],
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <View style={{ padding: spacing[5], flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.neutral[900], fontWeight: '500' }}>Nouvelles missions</Text>
            <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
              Alertes quand une mission est disponible
            </Text>
          </View>
          <KycToggle testID="notif-new" value={newMissions} onChange={setNewMissions} />
        </View>
        <View style={{ padding: spacing[5] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', opacity: newMissions ? 1 : 0.45 }}>
            <Text style={{ color: colors.neutral[900], fontWeight: '500' }}>Son</Text>
            <KycToggle
              testID="notif-sound"
              value={sound}
              onChange={(next) => {
                if (!newMissions) {
                  return;
                }
                setSound(next);
                if (next) {
                  playMissionPing(true);
                }
              }}
            />
          </View>
          {!newMissions ? (
            <Text testID="notif-sound-helper" style={{ color: colors.neutral[500], fontSize: typography.size.label, marginTop: spacing[2] }}>
              Activez « Nouvelles missions » pour gérer le son.
            </Text>
          ) : null}
        </View>
        <View style={{ padding: spacing[5], flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.neutral[900], fontWeight: '500' }}>Rappels H-1</Text>
            <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
              1h avant chaque mission planifiée
            </Text>
          </View>
          <KycToggle testID="notif-h1" value={reminderH1} onChange={setReminderH1} />
        </View>
        <View style={{ padding: spacing[5], flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.neutral[900], fontWeight: '500' }}>Compte</Text>
            <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
              Paiements, dossier, sécurité
            </Text>
          </View>
          <KycToggle testID="notif-account" value={account} onChange={setAccount} />
        </View>
      </View>
    </SafeAreaView>
  );
}
