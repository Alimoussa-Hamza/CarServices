'use client';

import { colors, typography } from '@carservice/ui-tokens';

export function PlaceholderPage({
  title,
}: {
  title: string;
}) {
  return (
    <div>
      <h1 style={{ fontSize: typography.size.title }}>{title}</h1>
      <p style={{ color: colors.neutral[700] }}>Écran à venir.</p>
    </div>
  );
}
