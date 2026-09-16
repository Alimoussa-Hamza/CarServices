import type { InputHTMLAttributes, CSSProperties } from 'react';
import { colors, radius, spacing } from '@carservice/ui-tokens';

const base: CSSProperties = {
  width: '100%',
  borderRadius: radius.sm,
  border: `1px solid ${colors.neutral[300]}`,
  padding: `${spacing[4]}px ${spacing[5]}px`,
  fontSize: 14,
  backgroundColor: colors.neutral[0],
  color: colors.neutral[900],
};

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...base, ...props.style }} />;
}
