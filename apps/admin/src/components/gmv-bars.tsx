import type { AdminDashboardGmvDay } from '@carservice/shared-types';
import { colors, spacing } from '@carservice/ui-tokens';
import { formatEurFromCents, gmvBarHeights } from '@/lib/format';

const BAR_MAX_PX = 88;

export function GmvBars({ days }: { days: AdminDashboardGmvDay[] }) {
  const heights = gmvBarHeights(
    days.map((day) => day.amountCents),
    BAR_MAX_PX,
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 3,
        height: BAR_MAX_PX,
      }}
      aria-label="GMV 30 derniers jours"
    >
      {days.map((day, index) => (
        <div
          key={day.date}
          title={`${day.date} · ${formatEurFromCents(day.amountCents)}`}
          style={{
            flex: 1,
            height: heights[index] ?? 2,
            backgroundColor: colors.brand.primary,
            borderRadius: 2,
            minWidth: 4,
            opacity: day.amountCents === 0 ? 0.25 : 1,
          }}
        />
      ))}
    </div>
  );
}

export function GmvBarsHint({ days }: { days: AdminDashboardGmvDay[] }) {
  if (days.length === 0) {
    return null;
  }
  return (
    <p style={{ marginTop: spacing[4], fontSize: 13, color: colors.neutral[500] }}>
      {days[0]?.date} → {days[days.length - 1]?.date}
    </p>
  );
}
