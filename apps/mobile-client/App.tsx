import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initApiClient, api } from '@carservice/api-client';
import { colors, spacing } from '@carservice/ui-tokens';

initApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
});

export default function App() {
  const [apiStatus, setApiStatus] = useState<string>('…');

  useEffect(() => {
    api.health
      .check()
      .then((res) => setApiStatus(res.status))
      .catch(() => setApiStatus('hors ligne'));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CARSERVICE</Text>
      <Text style={styles.subtitle}>Lavage à domicile</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Statut API</Text>
        <Text style={styles.cardValue}>{apiStatus}</Text>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[7],
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.neutral[0],
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[0],
    opacity: 0.9,
    marginTop: spacing[3],
  },
  card: {
    marginTop: spacing[8],
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing[7],
    minWidth: 200,
    alignItems: 'center',
  },
  cardLabel: {
    color: colors.neutral[700],
    fontSize: 14,
  },
  cardValue: {
    color: colors.brand.primary,
    fontSize: 20,
    fontWeight: '600',
    marginTop: spacing[3],
  },
});
