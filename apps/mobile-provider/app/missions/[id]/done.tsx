import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '../../../src/components/ui/button';
import { fetchCompletedMissions } from '../../../src/data/missions';
import { useTheme } from '../../../src/theme/theme-provider';

/** P06 Clôture — CS-M12-S07. Pas de confettis. */
export default function MissionDoneScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = typeof params.id === 'string' ? params.id : '';
  const [net, setNet] = useState('—');
  const [offer, setOffer] = useState('');

  useEffect(() => {
    void fetchCompletedMissions().then((rows) => {
      const row = rows.find((item) => item.id === bookingId) ?? rows[0];
      if (row) {
        setNet(row.netLabel);
        setOffer(row.offerName);
      }
    });
  }, [bookingId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing[6],
          paddingTop: spacing[8],
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#E9F5EE',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing[6],
          }}
        >
          <Ionicons name="checkmark-circle" size={44} color={colors.semantic.success} />
        </View>
        <Text
          testID="mission-done-title"
          style={{
            color: colors.neutral[900],
            fontSize: 24,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: spacing[2],
          }}
        >
          Prestation terminée
        </Text>
        <Text
          style={{
            color: colors.neutral[700],
            textAlign: 'center',
            marginBottom: spacing[6],
          }}
        >
          Merci, votre mission a bien été enregistrée.
        </Text>
        <View
          style={{
            width: '100%',
            backgroundColor: colors.neutral[0],
            borderRadius: 16,
            padding: spacing[6],
            alignItems: 'center',
            marginBottom: spacing[4],
          }}
        >
          <Text style={{ color: colors.neutral[700], fontWeight: '600' }}>Vous avez gagné</Text>
          <Text
            testID="mission-done-net"
            style={{
              color: colors.brand.primary,
              fontSize: 32,
              fontWeight: '800',
              marginVertical: spacing[2],
            }}
          >
            {net}
          </Text>
          <Text style={{ color: colors.neutral[500], fontSize: typography.size.label, textAlign: 'center' }}>
            Versé sur votre compte sous 2 à 3 jours ouvrés.
          </Text>
        </View>
        {offer ? (
          <View
            style={{
              width: '100%',
              backgroundColor: colors.neutral[0],
              borderRadius: radius.md,
              padding: spacing[5],
            }}
          >
            <Text style={{ color: colors.neutral[700] }}>Formule</Text>
            <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>{offer}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[5] }}>
        <Button
          testID="mission-done-gains"
          onPress={() => router.replace('/(tabs)/gains' as Href)}
        >
          Voir mes gains
        </Button>
        <Button
          variant="ghost"
          onPress={() => router.replace('/(tabs)/missions' as Href)}
        >
          Retour aux missions
        </Button>
      </View>
    </SafeAreaView>
  );
}
