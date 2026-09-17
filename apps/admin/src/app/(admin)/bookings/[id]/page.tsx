'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ApiError } from '@carservice/api-client';
import type { AdminBookingDetail } from '@carservice/shared-types';
import { colors, spacing, typography } from '@carservice/ui-tokens';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchAdminBooking, refundAdminBooking } from '@/lib/api';
import {
  formatActorTypeFr,
  formatClientName,
  formatPaymentStatusFr,
  formatSlotRange,
  isPaymentRefundable,
  parseRefundReason,
  willCancelByAdmin,
} from '@/lib/bookings';
import { formatBookingStatusFr, formatEurFromCents } from '@/lib/format';

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = typeof params.id === 'string' ? params.id : '';
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const detail = await fetchAdminBooking(bookingId);
    setBooking(detail);
  }

  useEffect(() => {
    if (!bookingId) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        await load();
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
            : 'Impossible de charger la réservation.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [bookingId, router]);

  async function onRefund() {
    if (!booking) {
      return;
    }
    const parsed = parseRefundReason(reason);
    if (parsed === null) {
      setActionError('Motif 3 à 300 caractères, ou vide.');
      return;
    }
    setActionError(null);
    setNotice(null);
    setBusy(true);
    try {
      const result = await refundAdminBooking(
        booking.id,
        parsed ? { reason: parsed } : {},
      );
      setReason('');
      await load();
      setNotice(
        `Remboursement ${formatEurFromCents(result.refundCents)} · action ${result.action}.`,
      );
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'Remboursement impossible.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p style={{ color: colors.neutral[700] }}>Chargement réservation…</p>;
  }

  if (error || !booking) {
    return (
      <Card>
        <p style={{ color: colors.semantic.error }}>
          {error ?? 'Réservation introuvable.'}
        </p>
        <p style={{ marginTop: spacing[4] }}>
          <Link href="/bookings" style={{ color: colors.brand.primary }}>
            Retour à la liste
          </Link>
        </p>
      </Card>
    );
  }

  const client = booking.client;
  const address = booking.addressSnapshot;
  const refundable = isPaymentRefundable(booking.paymentStatus);
  const cancels = willCancelByAdmin(booking.status);

  return (
    <div style={{ display: 'grid', gap: spacing[7], maxWidth: 880 }}>
      <div>
        <Link href="/bookings" style={{ color: colors.brand.primary, fontSize: 14 }}>
          ← Réservations
        </Link>
        <h1 style={{ fontSize: typography.size.title, marginTop: spacing[3] }}>
          {booking.reference}
        </h1>
        <p style={{ color: colors.neutral[700] }}>
          {formatBookingStatusFr(booking.status)} ·{' '}
          {formatPaymentStatusFr(booking.paymentStatus)} ·{' '}
          {formatEurFromCents(booking.totalCents)}
        </p>
      </div>

      {notice ? (
        <Card>
          <p style={{ color: colors.semantic.success }}>{notice}</p>
        </Card>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing[6],
        }}
      >
        <Card>
          <h2 style={{ fontSize: 16, marginBottom: spacing[5] }}>Mission</h2>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              rowGap: spacing[3],
              fontSize: 14,
            }}
          >
            <dt style={{ color: colors.neutral[500] }}>Offre</dt>
            <dd>{booking.offerName}</dd>
            <dt style={{ color: colors.neutral[500] }}>Créneau</dt>
            <dd>{formatSlotRange(booking.slotStart, booking.slotEnd)}</dd>
            <dt style={{ color: colors.neutral[500] }}>Zone</dt>
            <dd>{booking.zone.name}</dd>
            <dt style={{ color: colors.neutral[500] }}>Adresse</dt>
            <dd>
              {address
                ? `${address.street}, ${address.postalCode} ${address.city}`
                : '—'}
            </dd>
            <dt style={{ color: colors.neutral[500] }}>Client</dt>
            <dd>
              {client ? formatClientName(client) : '—'}
              {client?.phone ? ` · ${client.phone}` : ''}
            </dd>
            <dt style={{ color: colors.neutral[500] }}>Pro</dt>
            <dd>{booking.provider?.companyName ?? 'Non assigné'}</dd>
            <dt style={{ color: colors.neutral[500] }}>Commentaire</dt>
            <dd>{booking.clientComment ?? '—'}</dd>
          </dl>
        </Card>

        <Card>
          <h2 style={{ fontSize: 16, marginBottom: spacing[5] }}>Paiement</h2>
          {booking.payment ? (
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                rowGap: spacing[3],
                fontSize: 14,
                marginBottom: spacing[6],
              }}
            >
              <dt style={{ color: colors.neutral[500] }}>Statut</dt>
              <dd>{formatPaymentStatusFr(booking.payment.status)}</dd>
              <dt style={{ color: colors.neutral[500] }}>Montant</dt>
              <dd>{formatEurFromCents(booking.payment.amountCents)}</dd>
              <dt style={{ color: colors.neutral[500] }}>Commission</dt>
              <dd>{formatEurFromCents(booking.payment.commissionCents)}</dd>
              <dt style={{ color: colors.neutral[500] }}>Net pro</dt>
              <dd>{formatEurFromCents(booking.payment.providerNetCents)}</dd>
              <dt style={{ color: colors.neutral[500] }}>Stripe PI</dt>
              <dd style={{ wordBreak: 'break-all' }}>
                {booking.payment.stripePaymentIntentId}
              </dd>
            </dl>
          ) : (
            <p style={{ color: colors.neutral[700], marginBottom: spacing[6] }}>
              Aucun paiement.
            </p>
          )}

          {refundable ? (
            <div style={{ display: 'grid', gap: spacing[4] }}>
              {!cancels ? (
                <p style={{ fontSize: 13, color: colors.neutral[700] }}>
                  Le paiement sera remboursé. Le statut booking ne passera pas à
                  annulé admin (en cours, terminé ou litige).
                </p>
              ) : (
                <p style={{ fontSize: 13, color: colors.neutral[700] }}>
                  RG-PAY-05 : libère l’auth ou reverse la capture. Le booking
                  passe à annulé admin.
                </p>
              )}
              <div>
                <Label htmlFor="refund-reason">Motif (optionnel)</Label>
                <Input
                  id="refund-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Geste commercial"
                />
              </div>
              {actionError ? (
                <p style={{ color: colors.semantic.error, fontSize: 14 }}>
                  {actionError}
                </p>
              ) : null}
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => void onRefund()}
              >
                Rembourser
              </Button>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: colors.neutral[700] }}>
              Remboursement indisponible ({formatPaymentStatusFr(booking.paymentStatus)}
              ).
            </p>
          )}
        </Card>
      </div>

      <Card>
        <h2 style={{ fontSize: 16, marginBottom: spacing[5] }}>Timeline</h2>
        {booking.timeline.length === 0 ? (
          <p style={{ color: colors.neutral[700] }}>Aucun événement.</p>
        ) : (
          <ol style={{ display: 'grid', gap: spacing[4], margin: 0, padding: 0 }}>
            {booking.timeline.map((event, index) => (
              <li
                key={`${event.createdAt}-${index}`}
                style={{
                  listStyle: 'none',
                  fontSize: 14,
                  borderLeft: `3px solid ${colors.brand.primary}`,
                  paddingLeft: spacing[4],
                }}
              >
                <strong>
                  {event.fromStatus
                    ? `${formatBookingStatusFr(event.fromStatus)} → `
                    : ''}
                  {formatBookingStatusFr(event.toStatus)}
                </strong>
                <div style={{ color: colors.neutral[700] }}>
                  {formatActorTypeFr(event.actorType)} ·{' '}
                  {new Date(event.createdAt).toLocaleString('fr-FR')}
                </div>
                {event.reason ? (
                  <div style={{ color: colors.neutral[500] }}>{event.reason}</div>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
