import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KYC_STEPS, type KycStep } from '../../lib/kyc-validation';
import { useTheme } from '../../theme/theme-provider';
import { Button } from '../ui/button';
import { ErrorBanner } from '../ui/error-banner';

export type KycWizardChromeProps = {
  step: KycStep;
  title: string;
  subtitle: string;
  ctaLabel: string;
  canContinue: boolean;
  loading?: boolean;
  error?: string | null;
  onBack: () => void;
  onContinue: () => void;
  children: ReactNode;
};

export function KycWizardChrome({
  step,
  title,
  subtitle,
  ctaLabel,
  canContinue,
  loading = false,
  error,
  onBack,
  onContinue,
  children,
}: KycWizardChromeProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
      <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[2] }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing[4],
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            testID="kyc-back"
            style={{ width: 36, height: 36, justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.neutral[900]} />
          </Pressable>
          <Text
            testID="kyc-step-index"
            style={{
              color: colors.neutral[500],
              fontSize: typography.size.label,
              fontWeight: '600',
            }}
          >
            {step}/7
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing[5] }}>
          {KYC_STEPS.map((item) => (
            <View
              key={item}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 99,
                backgroundColor:
                  item <= step ? colors.brand.primary : colors.neutral[300],
              }}
            />
          ))}
        </View>
        <Text
          testID="kyc-title"
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.title,
            fontWeight: '700',
            marginBottom: spacing[2],
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: colors.neutral[700],
            fontSize: typography.size.caption,
            marginBottom: spacing[3],
          }}
        >
          {subtitle}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[7],
          gap: spacing[5],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <ErrorBanner message={error} testID="kyc-error" /> : null}
        {children}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[3],
          paddingBottom: spacing[4],
          backgroundColor: colors.neutral[100],
        }}
      >
        <Button
          testID="kyc-continue"
          disabled={!canContinue}
          loading={loading}
          onPress={onContinue}
        >
          {ctaLabel}
        </Button>
      </View>
    </SafeAreaView>
  );
}
