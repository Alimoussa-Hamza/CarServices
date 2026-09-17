import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTheme } from '../../src/theme/theme-provider';

/** Draft KYC always starts at wizard step 1. */
export default function KycStartScreen() {
  const { colors } = useTheme();

  useEffect(() => {
    router.replace('/(kyc)/wizard/1' as Href);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.neutral[100],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator color={colors.brand.primary} testID="kyc-start" />
    </View>
  );
}
