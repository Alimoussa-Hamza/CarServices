import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { Checkbox } from '../../src/components/ui/checkbox';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { Input } from '../../src/components/ui/input';
import { OtpInput } from '../../src/components/ui/otp-input';
import { MOCK_OTP_CODE, sendOtp, verifyOtp } from '../../src/data/auth';
import { env } from '../../src/config/env';
import { mapApiError } from '../../src/lib/api-errors';
import { isValidFrMobile } from '../../src/lib/phone';
import { syncKycAndResolveRoute } from '../../src/lib/sync-session';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

type Step = 'phone' | 'otp';

/** P00 Auth — CS-M12-S02 */
export default function LoginScreen() {
  const { colors, spacing, typography } = useTheme();
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const onSend = async () => {
    setError(null);
    if (!isValidFrMobile(phone)) {
      setPhoneError('Numéro mobile français invalide (06/07).');
      return;
    }
    setPhoneError(undefined);
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep('otp');
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const canContinue = acceptTerms && code.trim().length === 6;

  const onVerify = async () => {
    setError(null);
    if (!canContinue) {
      return;
    }
    setLoading(true);
    try {
      const session = await verifyOtp({
        phoneRaw: phone,
        code,
        acceptTerms: true,
      });
      await setSession(session);
      const route = await syncKycAndResolveRoute();
      router.replace(route as Href);
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.neutral[100] }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing[7],
          paddingTop: spacing[8],
          paddingBottom: spacing[7],
          gap: spacing[5],
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: colors.brand.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.neutral[0], fontWeight: '800', fontSize: 11 }}>
              CW
            </Text>
          </View>
          <Text style={{ color: colors.neutral[900], fontWeight: '600' }}>CarWash Pro</Text>
        </View>

        <Text
          style={{
            fontSize: typography.size.title,
            color: colors.neutral[900],
            fontWeight: '700',
          }}
        >
          Connexion
        </Text>
        <Text style={{ color: colors.neutral[700], fontSize: typography.size.body }}>
          {step === 'phone'
            ? 'Recevez le code par SMS pour continuer.'
            : 'Saisissez le code à 6 chiffres.'}
        </Text>

        {error ? <ErrorBanner message={error} testID="auth-error" /> : null}

        {step === 'phone' ? (
          <>
            <Input
              label="Numéro de téléphone"
              prefix="+33"
              placeholder="6 12 34 56 78"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={setPhone}
              error={phoneError}
              helper="Un code à 6 chiffres vous sera envoyé par SMS."
              testID="auth-phone"
            />
            <Button loading={loading} onPress={() => void onSend()} testID="auth-send-otp">
              Envoyer le code
            </Button>
          </>
        ) : (
          <>
            <OtpInput value={code} onChangeText={setCode} testID="auth-otp" />
            {env.useMocks ? (
              <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
                Mode mock — code : {MOCK_OTP_CODE}
              </Text>
            ) : null}
            <Checkbox
              checked={acceptTerms}
              onChange={setAcceptTerms}
              label="J'accepte les Conditions Générales d'Utilisation et la Politique de confidentialité"
              testID="auth-cgu"
            />
            <Button
              loading={loading}
              disabled={!canContinue}
              onPress={() => void onVerify()}
              testID="auth-verify"
            >
              Continuer
            </Button>
            <Button
              variant="ghost"
              disabled={loading}
              onPress={() => {
                setStep('phone');
                setCode('');
                setError(null);
              }}
            >
              Changer de numéro
            </Button>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
