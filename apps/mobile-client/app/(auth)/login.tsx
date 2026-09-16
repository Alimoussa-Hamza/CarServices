import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { Checkbox } from '../../src/components/ui/checkbox';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { Input } from '../../src/components/ui/input';
import { OtpInput } from '../../src/components/ui/otp-input';
import { MOCK_OTP_CODE, sendOtp, verifyOtp } from '../../src/data/auth';
import { env } from '../../src/config/env';
import { mapApiError } from '../../src/lib/api-errors';
import { isValidFrMobile, normalizeFrPhone } from '../../src/lib/phone';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme/theme-provider';

type Step = 'phone' | 'otp';

/** C01 Auth OTP — CS-M11-S02 */
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

  const onVerify = async () => {
    setError(null);
    if (!acceptTerms) {
      setError('Accepte les CGU pour continuer.');
      return;
    }
    if (code.trim().length !== 6) {
      setError('Saisis le code à 6 chiffres.');
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
      router.replace('/(tabs)');
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
          padding: spacing[7],
          justifyContent: 'center',
          gap: spacing[5],
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: typography.size.display,
            lineHeight: typography.lineHeight.display,
            color: colors.brand.primary,
            fontWeight: '700',
          }}
        >
          CarWash
        </Text>
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
            ? 'Entre ton numéro pour recevoir un code SMS.'
            : `Code envoyé au ${normalizeFrPhone(phone)}.`}
        </Text>

        {error ? <ErrorBanner message={error} testID="auth-error" /> : null}

        {step === 'phone' ? (
          <>
            <Input
              label="Téléphone"
              placeholder="06 12 34 56 78"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={setPhone}
              error={phoneError}
              testID="auth-phone"
            />
            <Button loading={loading} onPress={onSend} testID="auth-send-otp">
              Recevoir le code
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
              label="J'accepte les CGU et la politique de confidentialité"
              testID="auth-cgu"
            />
            <Button loading={loading} onPress={onVerify} testID="auth-verify">
              Se connecter
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

        <View style={{ marginTop: spacing[4] }}>
          <Link href="/" asChild>
            <Button variant="secondary">Retour</Button>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
