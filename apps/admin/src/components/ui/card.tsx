import type { HTMLAttributes, ReactNode } from 'react';
import { colors, radius, spacing } from '@carservice/ui-tokens';

export function Card({
  children,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      {...rest}
      style={{
        backgroundColor: colors.neutral[0],
        borderRadius: radius.lg,
        border: `1px solid ${colors.neutral[300]}`,
        padding: spacing[8],
        boxShadow: '0 8px 24px rgba(26, 26, 46, 0.06)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
