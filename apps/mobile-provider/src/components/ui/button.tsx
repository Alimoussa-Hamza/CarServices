import { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type View,
} from 'react-native';
import { useTheme } from '../../theme/theme-provider';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children: string;
  testID?: string;
};

export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    variant = 'primary',
    loading = false,
    disabled,
    children,
    testID,
    style,
    ...rest
  },
  ref,
) {
  const { colors, radius, spacing, typography } = useTheme();
  const isDisabled = Boolean(disabled || loading);

  const backgroundByVariant: Record<ButtonVariant, string> = {
    primary: colors.brand.primary,
    secondary: colors.neutral[0],
    ghost: 'transparent',
  };

  const textByVariant: Record<ButtonVariant, string> = {
    primary: colors.neutral[0],
    secondary: colors.neutral[900],
    ghost: colors.brand.primary,
  };

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      testID={testID}
      style={(state) => [
        styles.base,
        {
          backgroundColor: isDisabled && variant === 'primary'
            ? colors.neutral[300]
            : backgroundByVariant[variant],
          borderRadius: radius.md,
          paddingVertical: spacing[5],
          paddingHorizontal: spacing[5],
          opacity: isDisabled ? 1 : state.pressed ? 0.85 : 1,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.neutral[300],
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={
            isDisabled && variant === 'primary'
              ? colors.neutral[500]
              : textByVariant[variant]
          }
        />
      ) : (
        <Text
          style={{
            color:
              isDisabled && variant === 'primary'
                ? colors.neutral[500]
                : textByVariant[variant],
            fontSize: typography.size.body,
            fontWeight: '700',
          }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
});
