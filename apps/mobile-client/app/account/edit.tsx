import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { Input } from '../../src/components/ui/input';
import { StickyCta } from '../../src/components/ui/sticky-cta';
import { getClientProfile, updateClientProfile } from '../../src/data/profile';
import { mapApiError } from '../../src/lib/api-errors';
import { useTheme } from '../../src/theme/theme-provider';

/** C13 — edit first/last name */
export default function EditProfileScreen() {
  const { colors, spacing, typography } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const profile = await getClientProfile();
          if (!active) {
            return;
          }
          setFirstName(profile.firstName ?? '');
          setLastName(profile.lastName ?? '');
        } catch (err) {
          if (active) {
            setError(mapApiError(err));
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const onSave = async () => {
    setError(null);
    if (!firstName.trim() && !lastName.trim()) {
      setError('Indique au moins un prénom ou un nom.');
      return;
    }
    setSaving(true);
    try {
      await updateClientProfile({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
      });
      Alert.alert('Profil mis à jour', undefined, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: 140 }}>
        <Text style={{ color: colors.neutral[700], fontSize: typography.size.body }}>
          Ces infos aident le pro à te reconnaître sur place.
        </Text>
        {error ? <ErrorBanner message={error} /> : null}
        {!loading ? (
          <>
            <Input
              label="Prénom"
              value={firstName}
              onChangeText={setFirstName}
              testID="profile-edit-first"
              autoCapitalize="words"
            />
            <Input
              label="Nom"
              value={lastName}
              onChangeText={setLastName}
              testID="profile-edit-last"
              autoCapitalize="words"
            />
          </>
        ) : null}
      </ScrollView>
      <StickyCta
        testID="profile-edit-save"
        label="Enregistrer"
        loading={saving || loading}
        onPress={() => void onSave()}
      />
    </View>
  );
}
