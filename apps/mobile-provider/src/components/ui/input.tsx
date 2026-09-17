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
  prefix?: string;
  testID?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helper, prefix, testID, style, ...rest },
  ref,
) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View style={{ gap: spacing[2] }}>
      {label ? (
        <Text
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.caption,
            fontWeight: '600',
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: error ? colors.semantic.error : colors.brand.primary,
          borderRadius: radius.md,
          backgroundColor: colors.neutral[0],
          paddingHorizontal: spacing[5],
          minHeight: 56,
        }}
      >
        {prefix ? (
          <Text
            style={{
              color: colors.neutral[900],
              fontSize: typography.size.body,
              fontWeight: '600',
              marginRight: spacing[3],
              paddingRight: spacing[3],
              borderRightWidth: 1,
              borderRightColor: colors.neutral[300],
            }}
          >
            {prefix}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          testID={testID}
          placeholderTextColor={colors.neutral[500]}
          style={[
            styles.field,
            {
              color: colors.neutral[900],
              fontSize: typography.size.body,
              flex: 1,
              paddingVertical: spacing[4],
            },
            style,
          ]}
          {...rest}
        />
      </View>
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
    borderWidth: 0,
  },
});
