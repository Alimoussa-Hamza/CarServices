import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { Input } from './input';

export type OtpInputProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'keyboardType' | 'maxLength'
> & {
  value: string;
  onChangeText: (code: string) => void;
  error?: string;
  testID?: string;
};

export const OtpInput = forwardRef<TextInput, OtpInputProps>(function OtpInput(
  { value, onChangeText, error, testID, ...rest },
  ref,
) {
  return (
    <Input
      ref={ref}
      label="Code à 6 chiffres"
      value={value}
      onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, 6))}
      keyboardType="number-pad"
      textContentType="oneTimeCode"
      autoComplete="sms-otp"
      maxLength={6}
      error={error}
      testID={testID}
      {...rest}
    />
  );
});

OtpInput.displayName = 'OtpInput';
