import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { colors, radius, spacing } from '@carservice/ui-tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

const styles: Record<Variant, CSSProperties> = {
  primary: {
    backgroundColor: colors.brand.primary,
    color: colors.neutral[0],
    border: 'none',
  },
  secondary: {
    backgroundColor: colors.neutral[0],
    color: colors.neutral[900],
    border: `1px solid ${colors.neutral[300]}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.brand.primary,
    border: 'none',
  },
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

/** Bouton style shadcn (tokens CARSERVICE). */
export function Button({
  variant = 'primary',
  style,
  disabled,
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        ...styles[variant],
        borderRadius: radius.sm,
        padding: `${spacing[4]}px ${spacing[6]}px`,
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
