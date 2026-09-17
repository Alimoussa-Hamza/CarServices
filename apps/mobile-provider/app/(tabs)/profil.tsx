import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '../../src/components/ui/button';
import { fetchRcProAlert, type RcProBadge } from '../../src/data/kyc';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

/** P09 Profil — CS-M12-S11 badge RC + notifs. */
export default function ProfilScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [alert, setAlert] = useState<RcProBadge>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    void fetchRcProAlert().then(setAlert);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[100] }} edges={['bottom']}>
      <Text
        testID="profil-title"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
          paddingHorizontal: spacing[5],
          paddingTop: spacing[2],
        }}
      >
        Profil
      </Text>
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
        <View
          style={{
            backgroundColor: colors.neutral[0],
            borderRadius: 16,
            padding: spacing[5],
          }}
        >
          <Text style={{ color: colors.neutral[900], fontWeight: '700', fontSize: typography.size.body }}>
            {user?.phone ?? 'Professionnel'}
          </Text>
          <Text style={{ color: colors.neutral[700], fontSize: typography.size.label }}>
            Auto-entrepreneur
          </Text>
        </View>

        <View style={{ backgroundColor: colors.neutral[0], borderRadius: radius.md, overflow: 'hidden' }}>
          <Pressable
            testID="profil-notifs"
            onPress={() => router.push('/profil/notifs' as Href)}
            style={{ flexDirection: 'row', alignItems: 'center', padding: spacing[5], gap: spacing[3] }}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.brand.primary} />
            <Text style={{ flex: 1, color: colors.neutral[900], fontWeight: '500' }}>Notifications</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.neutral[300]} />
          </Pressable>
          <View style={{ height: 1, backgroundColor: '#F0F2F4' }} />
          <View
            testID="profil-rc-row"
            style={{ flexDirection: 'row', alignItems: 'center', padding: spacing[5], gap: spacing[3] }}
          >
            <Ionicons name="shield-outline" size={18} color={colors.brand.primary} />
            <Text style={{ color: colors.neutral[900], fontWeight: '500' }}>Assurance</Text>
            {alert?.kind === 'expiring_soon' ? (
              <View
                style={{
                  backgroundColor: '#FBF0DD',
                  borderRadius: 99,
                  paddingHorizontal: spacing[2],
                  paddingVertical: 2,
                }}
              >
                <Text
                  testID="profil-rc-badge"
                  style={{ color: colors.semantic.warning, fontSize: 9, fontWeight: '700' }}
                >
                  RC Pro · expire dans {alert.daysRemaining} j
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          testID="profil-logout"
          onPress={() => setLogoutOpen(true)}
          style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: colors.semantic.error, fontWeight: '700' }}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#0B1F3399', alignItems: 'center', justifyContent: 'center' }}>
          <View
            testID="logout-sheet"
            style={{
              width: 300,
              backgroundColor: colors.neutral[0],
              borderRadius: 16,
              padding: spacing[6],
            }}
          >
            <Text
              style={{
                color: colors.neutral[900],
                fontWeight: '700',
                fontSize: typography.size.body,
                textAlign: 'center',
                marginBottom: spacing[2],
              }}
            >
              Se déconnecter ?
            </Text>
            <Text
              style={{
                color: colors.neutral[700],
                fontSize: typography.size.caption,
                textAlign: 'center',
                marginBottom: spacing[5],
              }}
            >
              Vous devrez vous reconnecter avec votre numéro de téléphone.
            </Text>
            <Button
              testID="logout-confirm"
              onPress={() => {
                void clearSession().then(() => router.replace('/(auth)/login' as Href));
              }}
            >
              Se déconnecter
            </Button>
            <Button variant="ghost" onPress={() => setLogoutOpen(false)}>
              Annuler
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
