import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import type { ClientProfile } from '@carservice/shared-types';
import { Button } from '../../src/components/ui/button';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { deleteClientAccount, getClientProfile } from '../../src/data/profile';
import { mapApiError } from '../../src/lib/api-errors';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

type MenuRowProps = {
  label: string;
  onPress: () => void;
  testID?: string;
  destructive?: boolean;
};

function MenuRow({ label, onPress, testID, destructive }: MenuRowProps) {
  const { colors, spacing, typography, radius } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{
        backgroundColor: colors.neutral[0],
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.neutral[300],
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[5],
      }}
    >
      <Text
        style={{
          color: destructive ? colors.semantic.error : colors.neutral[900],
          fontSize: typography.size.body,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** C13 Profil + adresses hub — CS-M11-S10 */
export default function ProfileScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const authUser = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!authUser) {
      setProfile(null);
      setLoading(false);
      return;
    }
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      setProfile(await getClientProfile());
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authUser]);

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Client CarWash';

  const onDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action anonymise ton compte (RGPD). Tu ne pourras plus te reconnecter avec ce numéro.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteClientAccount();
                await clearSession();
                router.replace('/(auth)/login');
              } catch (err) {
                setError(mapApiError(err));
              }
            })();
          },
        },
      ],
    );
  };

  if (!authUser) {
    return (
      <View
        style={{
          flex: 1,
          padding: spacing[7],
          backgroundColor: colors.neutral[100],
          gap: spacing[4],
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: typography.size.title, fontWeight: '700', color: colors.neutral[900] }}>
          Profil
        </Text>
        <Text style={{ color: colors.neutral[700] }}>Connecte-toi pour gérer ton compte.</Text>
        <Button testID="profile-login" onPress={() => router.push('/(auth)/login')}>
          Se connecter
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.neutral[100] }}
      contentContainerStyle={{ padding: spacing[7], gap: spacing[4], paddingBottom: spacing[10] }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} />
      }
      testID="profile-screen"
    >
      <Text style={{ fontSize: typography.size.title, color: colors.neutral[900], fontWeight: '700' }}>
        Profil
      </Text>

      {error ? <ErrorBanner message={error} onAction={() => void load('initial')} /> : null}
      {loading ? <ActivityIndicator color={colors.brand.primary} /> : null}

      {!loading && profile ? (
        <View
          style={{
            backgroundColor: colors.neutral[0],
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.neutral[300],
            padding: spacing[5],
            gap: spacing[2],
          }}
          testID="profile-card"
        >
          <Text style={{ fontWeight: '700', color: colors.neutral[900], fontSize: typography.size.body }}>
            {displayName}
          </Text>
          <Text style={{ color: colors.neutral[700] }}>{profile.phone}</Text>
          {profile.email ? (
            <Text style={{ color: colors.neutral[500], fontSize: typography.size.caption }}>
              {profile.email}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={{ gap: spacing[3] }}>
        <MenuRow
          label="Modifier mes infos"
          testID="profile-edit"
          onPress={() => router.push('/account/edit')}
        />
        <MenuRow
          label="Mes adresses"
          testID="profile-addresses"
          onPress={() => router.push('/account/addresses')}
        />
        <MenuRow
          label="Moyen de paiement"
          testID="profile-payment"
          onPress={() =>
            Alert.alert('Paiement', 'La gestion des cartes arrive avec Stripe Customer Portal.')
          }
        />
        <MenuRow
          label="Aide & support"
          testID="profile-support"
          onPress={() => void Linking.openURL('mailto:support@carservice.app')}
        />
        <MenuRow
          label="CGU"
          testID="profile-cgu"
          onPress={() => void Linking.openURL('https://carservice.app/cgu')}
        />
      </View>

      <Button
        variant="secondary"
        testID="profile-logout"
        onPress={async () => {
          await clearSession();
          router.replace('/(auth)/login');
        }}
      >
        Se déconnecter
      </Button>

      <MenuRow
        label="Supprimer mon compte"
        testID="profile-delete"
        destructive
        onPress={onDeleteAccount}
      />
    </ScrollView>
  );
}
