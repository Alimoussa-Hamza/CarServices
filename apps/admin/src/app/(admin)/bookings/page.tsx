'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@carservice/api-client';
import type { AdminBookingListItem, BookingStatus } from '@carservice/shared-types';
import { colors, spacing, typography } from '@carservice/ui-tokens';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchAdminBookings } from '@/lib/api';
import {
  ADMIN_BOOKING_STATUS_FILTERS,
  ADMIN_BOOKINGS_PAGE_SIZE,
  formatClientName,
  formatPaymentStatusFr,
  formatSlotRange,
  parseBookingsSearchQuery,
} from '@/lib/bookings';
import { formatBookingStatusFr, formatEurFromCents } from '@/lib/format';

export default function BookingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminBookingListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [draftQuery, setDraftQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState<string | undefined>();
  const [status, setStatus] = useState<'' | BookingStatus>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const pageCount = Math.max(1, Math.ceil(total / ADMIN_BOOKINGS_PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await fetchAdminBookings({
          q: appliedQuery,
          status: status ? [status] : undefined,
          page,
          pageSize: ADMIN_BOOKINGS_PAGE_SIZE,
        });
        if (cancelled) {
          return;
        }
        setItems(response.items);
        setTotal(response.total);
        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace('/login');
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : 'Impossible de charger les réservations.',
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
  }, [appliedQuery, page, router, status]);

  function applySearch() {
    setPage(1);
    setAppliedQuery(parseBookingsSearchQuery(draftQuery));
  }

  return (
    <div style={{ display: 'grid', gap: spacing[7] }}>
      <div>
        <h1 style={{ fontSize: typography.size.title }}>Réservations</h1>
        <p style={{ color: colors.neutral[700] }}>
          Recherche référence / téléphone / société · {total} résultat
          {total > 1 ? 's' : ''}
        </p>
      </div>

      <Card>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr minmax(180px, 220px) auto',
            gap: spacing[4],
            alignItems: 'end',
            marginBottom: spacing[7],
          }}
        >
          <div>
            <Label htmlFor="booking-q">Recherche</Label>
            <Input
              id="booking-q"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="CS-20260917-1A78 ou +336…"
            />
          </div>
          <div>
            <Label htmlFor="booking-status">Statut</Label>
            <select
              id="booking-status"
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as '' | BookingStatus);
              }}
              style={{
                width: '100%',
                borderRadius: 8,
                border: `1px solid ${colors.neutral[300]}`,
                padding: `${spacing[4]}px ${spacing[5]}px`,
                fontSize: 14,
                backgroundColor: colors.neutral[0],
              }}
            >
              {ADMIN_BOOKING_STATUS_FILTERS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Filtrer</Button>
        </form>

        {error ? (
          <p style={{ color: colors.semantic.error, marginBottom: spacing[5] }}>
            {error}
          </p>
        ) : null}

        {loading ? (
          <p style={{ color: colors.neutral[700] }}>Chargement…</p>
        ) : items.length === 0 ? (
          <p style={{ color: colors.neutral[700] }}>Aucune réservation.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ textAlign: 'left', color: colors.neutral[500] }}>
                  <th style={{ padding: spacing[3] }}>Réf.</th>
                  <th style={{ padding: spacing[3] }}>Créneau</th>
                  <th style={{ padding: spacing[3] }}>Client</th>
                  <th style={{ padding: spacing[3] }}>Statut</th>
                  <th style={{ padding: spacing[3] }}>Paiement</th>
                  <th style={{ padding: spacing[3], textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderTop: `1px solid ${colors.neutral[300]}` }}
                  >
                    <td style={{ padding: spacing[3] }}>
                      <Link
                        href={`/bookings/${item.id}`}
                        style={{ color: colors.brand.primary, fontWeight: 600 }}
                      >
                        {item.reference}
                      </Link>
                      <div style={{ fontSize: 12, color: colors.neutral[500] }}>
                        {item.offerName}
                      </div>
                    </td>
                    <td style={{ padding: spacing[3] }}>
                      {formatSlotRange(item.slotStart, item.slotEnd)}
                    </td>
                    <td style={{ padding: spacing[3] }}>
                      {formatClientName(item.client)}
                      <div style={{ fontSize: 12, color: colors.neutral[500] }}>
                        {item.client.phone}
                      </div>
                    </td>
                    <td style={{ padding: spacing[3] }}>
                      {formatBookingStatusFr(item.status)}
                    </td>
                    <td style={{ padding: spacing[3] }}>
                      {formatPaymentStatusFr(item.paymentStatus)}
                    </td>
                    <td style={{ padding: spacing[3], textAlign: 'right' }}>
                      {formatEurFromCents(item.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > ADMIN_BOOKINGS_PAGE_SIZE ? (
          <div
            style={{
              display: 'flex',
              gap: spacing[4],
              marginTop: spacing[6],
              alignItems: 'center',
            }}
          >
            <Button
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Précédent
            </Button>
            <span style={{ fontSize: 14, color: colors.neutral[700] }}>
              Page {page} / {pageCount}
            </span>
            <Button
              variant="secondary"
              disabled={page >= pageCount || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Suivant
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
