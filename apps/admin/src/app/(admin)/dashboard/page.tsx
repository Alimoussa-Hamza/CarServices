'use client';

import { colors, spacing, typography } from '@carservice/ui-tokens';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div style={{ display: 'grid', gap: spacing[6] }}>
      <div>
        <h1 style={{ fontSize: typography.size.title }}>Dashboard</h1>
        <p style={{ color: colors.neutral[700] }}>
          KPIs à brancher en M13-S02 (`GET /admin/dashboard`).
        </p>
      </div>
      <Card>
        <p style={{ color: colors.neutral[700] }}>
          Session admin active. Prochaines stories : KYC, catalogue, zones,
          bookings.
        </p>
      </Card>
    </div>
  );
}
