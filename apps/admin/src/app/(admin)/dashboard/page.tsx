'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@carservice/api-client';
import type { AdminDashboard } from '@carservice/shared-types';
import { colors, spacing, typography } from '@carservice/ui-tokens';
import { Card } from '@/components/ui/card';
import { KpiCard } from '@/components/kpi-card';
import { GmvBars, GmvBarsHint } from '@/components/gmv-bars';
import { fetchAdminDashboard } from '@/lib/api';
import {
  formatBookingStatusFr,
  formatDelayMinutes,
  formatEurFromCents,
  formatPercent,
  sumBookingCounts,
} from '@/lib/format';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const dashboard = await fetchAdminDashboard();
        if (!cancelled) {
          setData(dashboard);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace('/login');
          return;
        }
        setError(
          err instanceof ApiError ? err.message : 'Impossible de charger le dashboard.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <p style={{ color: colors.neutral[700] }}>Chargement des KPIs…</p>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <p style={{ color: colors.semantic.error }}>{error ?? 'Aucune donnée.'}</p>
      </Card>
    );
  }

  const bookingTotal = sumBookingCounts(data.bookingsByStatus);
  const generated = new Date(data.generatedAt).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div style={{ display: 'grid', gap: spacing[7] }}>
      <div>
        <h1 style={{ fontSize: typography.size.title }}>Dashboard</h1>
        <p style={{ color: colors.neutral[700] }}>
          KPIs marketplace · UTC · mis à jour {generated}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: spacing[5],
        }}
      >
        <KpiCard
          label="GMV jour"
          value={formatEurFromCents(data.gmv.dayCents)}
          hint="Captures depuis 00:00 UTC"
        />
        <KpiCard
          label="GMV 7 j"
          value={formatEurFromCents(data.gmv.weekCents)}
        />
        <KpiCard
          label="GMV 30 j"
          value={formatEurFromCents(data.gmv.monthCents)}
        />
        <KpiCard
          label="Réservations"
          value={String(bookingTotal)}
          hint="Tous statuts"
          href="/bookings"
        />
        <KpiCard
          label="Taux d’acceptation"
          value={formatPercent(data.providerAcceptanceRateAvg)}
          hint="Pros KYC approved"
        />
        <KpiCard
          label="Délai matching"
          value={formatDelayMinutes(data.matchingDelayMedianMinutes)}
          hint="Médiane pending → accepted"
        />
        <KpiCard
          label="Litiges ouverts"
          value={String(data.openDisputes)}
          href="/disputes"
        />
        <KpiCard
          label="KYC en attente"
          value={String(data.providersPendingKyc)}
          href="/kyc"
        />
      </div>

      <Card>
        <h2 style={{ fontSize: 16, marginBottom: spacing[5] }}>
          GMV — 30 derniers jours
        </h2>
        {data.gmvLast30Days.length === 0 ? (
          <p style={{ color: colors.neutral[700] }}>Pas encore de captures.</p>
        ) : (
          <>
            <GmvBars days={data.gmvLast30Days} />
            <GmvBarsHint days={data.gmvLast30Days} />
          </>
        )}
      </Card>

      <Card>
        <h2 style={{ fontSize: 16, marginBottom: spacing[5] }}>
          Bookings par statut
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: `${spacing[3]}px 0`,
                  color: colors.neutral[500],
                  fontWeight: 600,
                }}
              >
                Statut
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: `${spacing[3]}px 0`,
                  color: colors.neutral[500],
                  fontWeight: 600,
                }}
              >
                Volume
              </th>
            </tr>
          </thead>
          <tbody>
            {data.bookingsByStatus.map((row) => (
              <tr key={row.status}>
                <td
                  style={{
                    padding: `${spacing[3]}px 0`,
                    borderTop: `1px solid ${colors.neutral[100]}`,
                  }}
                >
                  {formatBookingStatusFr(row.status)}
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    padding: `${spacing[3]}px 0`,
                    borderTop: `1px solid ${colors.neutral[100]}`,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {row.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
