import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import {
  fetchGains,
  filterGains,
  type GainsFilter,
  type GainsModel,
} from '../../src/data/gains';
import { mapApiError } from '../../src/lib/api-errors';
import { useTheme } from '../../src/theme/theme-provider';

const FILTERS: Array<{ id: GainsFilter; label: string }> = [
  { id: 'all', label: 'Tout' },
  { id: 'week', label: 'Cette semaine' },
  { id: 'month', label: 'Ce mois' },
];

/** P08 Gains — CS-M12-S08. Solde en transit, pas de camembert. */
export default function GainsScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const [gains, setGains] = useState<GainsModel | null>(null);
  const [filter, setFilter] = useState<GainsFilter>('all');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setGains(await fetchGains());
      setError(null);
    } catch (err) {
      setError(mapApiError(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = gains ? filterGains(gains.items, filter) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[100] }} edges={['bottom']}>
      <Text
        testID="gains-title"
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.title,
          fontWeight: '700',
          paddingHorizontal: spacing[5],
          paddingTop: spacing[2],
        }}
      >
        Gains
      </Text>
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
        {error ? <ErrorBanner message={error} /> : null}
        <View
          style={{
            backgroundColor: colors.neutral[0],
            borderRadius: 16,
            padding: spacing[6],
          }}
        >
          <Text style={{ color: colors.neutral[700], fontWeight: '600', textAlign: 'center' }}>
            Solde en transit
          </Text>
          <Text
            testID="gains-transit"
            style={{
              color: colors.brand.primary,
              fontSize: 32,
              fontWeight: '800',
              textAlign: 'center',
              marginVertical: spacing[2],
            }}
          >
            {gains?.transitLabel ?? '—'}
          </Text>
          <Text
            style={{
              color: colors.neutral[500],
              fontSize: typography.size.label,
              textAlign: 'center',
              marginBottom: spacing[5],
            }}
          >
            Virement Stripe Connect sous 2 à 3 jours ouvrés.
          </Text>
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F2F4', paddingTop: spacing[4] }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: colors.neutral[700], fontSize: typography.size.label }}>Cette semaine</Text>
              <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>{gains?.weekLabel ?? '—'}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#F0F2F4' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: colors.neutral[700], fontSize: typography.size.label }}>Ce mois</Text>
              <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>{gains?.monthLabel ?? '—'}</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#EDF0F3',
            borderRadius: radius.md,
            padding: 4,
            flexDirection: 'row',
            gap: 4,
          }}
        >
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                testID={`gains-filter-${item.id}`}
                onPress={() => setFilter(item.id)}
                style={{
                  flex: 1,
                  minHeight: 36,
                  borderRadius: 8,
                  backgroundColor: active ? colors.brand.secondary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: active ? colors.neutral[0] : colors.neutral[700],
                    fontWeight: '600',
                    fontSize: 13,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>Historique des paiements</Text>
        {items.map((item) => (
          <View
            key={item.id}
            testID={`gains-row-${item.id}`}
            style={{
              backgroundColor: colors.neutral[0],
              borderRadius: radius.md,
              padding: spacing[5],
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>{item.offerName}</Text>
              <Text style={{ color: colors.neutral[700], fontSize: typography.size.label }}>
                {item.slotLabel}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ color: colors.brand.primary, fontWeight: '700' }}>{item.netLabel.replace(' net', '')}</Text>
              <View
                style={{
                  backgroundColor: item.payout === 'paid' ? '#E9F5EE' : '#FBF0DD',
                  borderRadius: 99,
                  paddingHorizontal: spacing[2],
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    color: item.payout === 'paid' ? colors.semantic.success : colors.semantic.warning,
                    fontSize: 10,
                    fontWeight: '700',
                  }}
                >
                  {item.payout === 'paid' ? 'Versé' : 'En attente'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
