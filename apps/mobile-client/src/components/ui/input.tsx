import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useTheme } from '../../theme/theme-provider';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  testID?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helper, testID, style, ...rest },
  ref,
) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View style={{ gap: spacing[2] }}>
      {label ? (
        <Text
          style={{
            color: colors.neutral[700],
            fontSize: typography.size.caption,
            fontWeight: '600',
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        testID={testID}
        placeholderTextColor={colors.neutral[500]}
        style={[
          styles.field,
          {
            borderColor: error ? colors.semantic.error : colors.neutral[300],
            borderRadius: radius.md,
            backgroundColor: colors.neutral[0],
            color: colors.neutral[900],
            paddingHorizontal: spacing[5],
            paddingVertical: spacing[4],
            fontSize: typography.size.body,
            minHeight: 48,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={{ color: colors.semantic.error, fontSize: typography.size.label }}>
          {error}
        </Text>
      ) : helper ? (
        <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
  },
});
