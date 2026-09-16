import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { Address } from '@carservice/shared-types';
import { Button } from '../../src/components/ui/button';
import { EmptyState } from '../../src/components/ui/empty-state';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { createAddress, deleteAddress, listAddresses } from '../../src/data/addresses';
import { mapApiError } from '../../src/lib/api-errors';
import { useTheme } from '../../src/theme/theme-provider';

/** C13 — Mes adresses (list + add demo + delete) */
export default function AddressesScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      setItems(await listAddresses());
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  const onAddDemo = async () => {
    setError(null);
    try {
      await createAddress({
        label: 'Autre',
        street: '8 place Bellecour',
        city: 'Lyon',
        postalCode: '69002',
        lat: 45.7578,
        lng: 4.832,
        country: 'FR',
      });
      await load('refresh');
    } catch (err) {
      setError(mapApiError(err));
    }
  };

  const onDelete = (address: Address) => {
    Alert.alert('Supprimer l’adresse', address.label ?? address.street, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteAddress(address.id);
              await load('refresh');
            } catch (err) {
              setError(mapApiError(err));
            }
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.neutral[100] }}
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: spacing[10] }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} />
      }
      testID="addresses-list"
    >
      {error ? <ErrorBanner message={error} onAction={() => void load('initial')} /> : null}
      {loading ? <ActivityIndicator color={colors.brand.primary} /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="Aucune adresse"
          description="Ajoute une adresse pour accélérer tes prochaines réservations."
          actionLabel="Ajouter (démo Lyon)"
          onAction={() => void onAddDemo()}
          testID="addresses-empty"
        />
      ) : null}

      {!loading
        ? items.map((address) => (
            <View
              key={address.id}
              testID={`address-card-${address.id}`}
              style={{
                backgroundColor: colors.neutral[0],
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.neutral[300],
                padding: spacing[5],
                gap: spacing[2],
              }}
            >
              <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>
                {address.label ?? 'Adresse'}
              </Text>
              <Text style={{ color: colors.neutral[700], fontSize: typography.size.caption }}>
                {address.street}
                {address.complement ? `\n${address.complement}` : ''}
                {`\n${address.postalCode} ${address.city}`}
              </Text>
              <Pressable onPress={() => onDelete(address)} testID={`address-delete-${address.id}`}>
                <Text style={{ color: colors.semantic.error, fontWeight: '600', marginTop: spacing[2] }}>
                  Supprimer
                </Text>
              </Pressable>
            </View>
          ))
        : null}

      {!loading && items.length > 0 ? (
        <Button variant="secondary" testID="addresses-add" onPress={() => void onAddDemo()}>
          Ajouter une adresse (démo)
        </Button>
      ) : null}
    </ScrollView>
  );
}
