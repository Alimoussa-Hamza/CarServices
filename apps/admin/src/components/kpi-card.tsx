import type { ReactNode } from 'react';
import Link from 'next/link';
import { colors, spacing, typography } from '@carservice/ui-tokens';
import { Card } from './ui/card';

export function KpiCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const body: ReactNode = (
    <>
      <p
        style={{
          fontSize: typography.size.label,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: colors.neutral[500],
          marginBottom: spacing[3],
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, color: colors.neutral[900] }}>
        {value}
      </p>
      {hint ? (
        <p
          style={{
            marginTop: spacing[3],
            fontSize: 13,
            color: colors.neutral[700],
          }}
        >
          {hint}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card style={{ height: '100%' }}>{body}</Card>
      </Link>
    );
  }

  return <Card>{body}</Card>;
}
