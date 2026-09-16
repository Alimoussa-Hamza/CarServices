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

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: string;
  testID?: string;
};

export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
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
    secondary: colors.brand.secondary,
    ghost: 'transparent',
    destructive: colors.semantic.error,
  };

  const textByVariant: Record<ButtonVariant, string> = {
    primary: colors.neutral[0],
    secondary: colors.neutral[0],
    ghost: colors.brand.primary,
    destructive: colors.neutral[0],
  };

  const paddingVertical = size === 'sm' ? spacing[3] : size === 'lg' ? spacing[5] : spacing[4];
  const paddingHorizontal = size === 'sm' ? spacing[4] : size === 'lg' ? spacing[7] : spacing[5];

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
          backgroundColor: backgroundByVariant[variant],
          borderRadius: radius.md,
          paddingVertical,
          paddingHorizontal,
          opacity: isDisabled ? 0.5 : state.pressed ? 0.85 : 1,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.brand.primary,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textByVariant[variant]} />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: textByVariant[variant],
              fontSize: typography.size.body,
              lineHeight: typography.lineHeight.body,
              fontFamily: typography.fontFamily.body,
            },
          ]}
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
    minHeight: 44,
  },
  label: {
    fontWeight: '600',
  },
});
