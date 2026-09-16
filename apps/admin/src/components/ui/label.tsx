import type { LabelHTMLAttributes } from 'react';
import { colors, spacing } from '@carservice/ui-tokens';

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: colors.neutral[700],
        marginBottom: spacing[3],
        ...props.style,
      }}
    />
  );
}
