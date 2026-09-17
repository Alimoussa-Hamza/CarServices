'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@carservice/api-client';
import type {
  AdminDisputeListItem,
  AdminResolveDisputeDecision,
  DisputeStatus,
} from '@carservice/shared-types';
import { colors, spacing, typography } from '@carservice/ui-tokens';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchAdminDisputes, resolveAdminDispute } from '@/lib/api';
import { formatClientName } from '@/lib/bookings';
import {
  ADMIN_DISPUTE_STATUS_FILTERS,
  ADMIN_DISPUTES_PAGE_SIZE,
  RESOLVE_DECISIONS,
  formatDisputeReasonFr,
  formatDisputeStatusFr,
  formatOpenedByFr,
  formatPaymentActionFr,
  isOpenDispute,
  parseResolveNotes,
  statusesFromFilter,
} from '@/lib/disputes';

export default function DisputesPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminDisputeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'' | 'resolved' | DisputeStatus>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_DISPUTES_PAGE_SIZE));

  async function load(preferredId?: string | null) {
    const response = await fetchAdminDisputes({
      status: statusesFromFilter(filter),
      page,
      pageSize: ADMIN_DISPUTES_PAGE_SIZE,
    });
    setItems(response.items);
    setTotal(response.total);
    setSelectedId((current) => {
      const nextPreferred = preferredId ?? current;
      if (
        nextPreferred &&
        response.items.some((item) => item.id === nextPreferred)
      ) {
        return nextPreferred;
      }
      return response.items[0]?.id ?? null;
    });
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        await load();
        if (!cancelled) {
          setError(null);
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
          err instanceof ApiError ? err.message : 'Impossible de charger les litiges.',
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
  }, [filter, page, router]);

  async function onResolve(decision: AdminResolveDisputeDecision) {
    if (!selected) {
      return;
    }
    const spec = RESOLVE_DECISIONS.find((item) => item.value === decision);
    const parsed = parseResolveNotes(notes, spec?.notesRequired === true);
    if (parsed === null) {
      setActionError(
        spec?.notesRequired
          ? 'Notes obligatoires (5 caractères minimum).'
          : 'Notes 5 à 2000 caractères, ou vides.',
      );
      return;
    }
    setActionError(null);
    setNotice(null);
    setBusy(true);
    try {
      const result = await resolveAdminDispute(
        selected.id,
        parsed ? { decision, notes: parsed } : { decision },
      );
      setNotes('');
      await load(null);
      setNotice(
        `${formatDisputeStatusFr(result.status)} · ${formatPaymentActionFr(result.paymentAction)}.`,
      );
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'Résolution impossible.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: spacing[6] }}>
      <div>
        <h1 style={{ fontSize: typography.size.title }}>Litiges</h1>
        <p style={{ color: colors.neutral[700] }}>
          File A07 · {total} dossier{total > 1 ? 's' : ''}
        </p>
      </div>

      <div>
        <Label htmlFor="dispute-status">Statut</Label>
        <select
          id="dispute-status"
          value={filter}
          onChange={(event) => {
            setPage(1);
            setFilter(event.target.value as '' | 'resolved' | DisputeStatus);
          }}
          style={{
            maxWidth: 240,
            borderRadius: 8,
            border: `1px solid ${colors.neutral[300]}`,
            padding: `${spacing[4]}px ${spacing[5]}px`,
            fontSize: 14,
            backgroundColor: colors.neutral[0],
          }}
        >
          {ADMIN_DISPUTE_STATUS_FILTERS.map((option) => (
            <option key={option.value || 'open-queue'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {notice ? (
        <Card>
          <p style={{ color: colors.semantic.success }}>{notice}</p>
        </Card>
      ) : null}

      {loading ? (
        <p style={{ color: colors.neutral[700] }}>Chargement litiges…</p>
      ) : error ? (
        <Card>
          <p style={{ color: colors.semantic.error }}>{error}</p>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <p style={{ color: colors.neutral[700] }}>Aucun litige.</p>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 320px) 1fr',
            gap: spacing[6],
            alignItems: 'start',
          }}
        >
          <Card style={{ padding: spacing[5] }}>
            <nav style={{ display: 'grid', gap: spacing[3] }}>
              {items.map((item) => {
                const active = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      setActionError(null);
                    }}
                    style={{
                      textAlign: 'left',
                      border: `1px solid ${active ? colors.brand.primary : colors.neutral[300]}`,
                      backgroundColor: active
                        ? colors.brand.primaryLight
                        : colors.neutral[0],
                      borderRadius: 8,
                      padding: spacing[4],
                      cursor: 'pointer',
                    }}
                  >
                    <strong>{item.bookingReference}</strong>
                    <div style={{ fontSize: 13, color: colors.neutral[700] }}>
                      {formatDisputeReasonFr(item.reason)} ·{' '}
                      {formatDisputeStatusFr(item.status)}
                    </div>
                  </button>
                );
              })}
            </nav>
            {total > ADMIN_DISPUTES_PAGE_SIZE ? (
              <div
                style={{
                  display: 'flex',
                  gap: spacing[3],
                  marginTop: spacing[5],
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
                <span style={{ fontSize: 13, color: colors.neutral[700] }}>
                  {page}/{pageCount}
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

          {selected ? (
            <Card>
              <h2 style={{ fontSize: 18, marginBottom: spacing[4] }}>
                {selected.bookingReference}
              </h2>
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
                <dd>{formatDisputeStatusFr(selected.status)}</dd>
                <dt style={{ color: colors.neutral[500] }}>Motif</dt>
                <dd>{formatDisputeReasonFr(selected.reason)}</dd>
                <dt style={{ color: colors.neutral[500] }}>Ouvert par</dt>
                <dd>{formatOpenedByFr(selected.openedBy)}</dd>
                <dt style={{ color: colors.neutral[500] }}>Client</dt>
                <dd>
                  {formatClientName(selected.client)} · {selected.client.phone}
                </dd>
                <dt style={{ color: colors.neutral[500] }}>Pro</dt>
                <dd>{selected.provider.companyName ?? selected.provider.id}</dd>
                <dt style={{ color: colors.neutral[500] }}>Payout</dt>
                <dd>{selected.payoutFrozen ? 'Gelé' : 'Dégelé'}</dd>
                <dt style={{ color: colors.neutral[500] }}>Ouvert le</dt>
                <dd>{new Date(selected.createdAt).toLocaleString('fr-FR')}</dd>
                <dt style={{ color: colors.neutral[500] }}>Booking</dt>
                <dd>
                  <Link
                    href={`/bookings/${selected.bookingId}`}
                    style={{ color: colors.brand.primary }}
                  >
                    Fiche réservation
                  </Link>
                </dd>
              </dl>

              <h3 style={{ fontSize: 15, marginBottom: spacing[3] }}>
                Description
              </h3>
              <p
                style={{
                  fontSize: 14,
                  whiteSpace: 'pre-wrap',
                  marginBottom: spacing[7],
                  color: colors.neutral[900],
                }}
              >
                {selected.description}
              </p>

              {isOpenDispute(selected.status) ? (
                <div style={{ display: 'grid', gap: spacing[4], maxWidth: 520 }}>
                  <div>
                    <Label htmlFor="dispute-notes">Notes de résolution</Label>
                    <Input
                      id="dispute-notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Ex. Remboursement intégral"
                    />
                  </div>
                  {actionError ? (
                    <p style={{ color: colors.semantic.error, fontSize: 14 }}>
                      {actionError}
                    </p>
                  ) : null}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[3] }}>
                    {RESOLVE_DECISIONS.map((decision) => (
                      <Button
                        key={decision.value}
                        variant={decision.variant}
                        disabled={busy}
                        title={decision.hint}
                        onClick={() => void onResolve(decision.value)}
                      >
                        {decision.label}
                      </Button>
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: colors.neutral[700] }}>
                    RG-DISPUTE-03 : freeze payout tant que le litige est ouvert.
                    Le booking reste `disputed`.
                  </p>
                </div>
              ) : (
                <p style={{ color: colors.neutral[700], fontSize: 14 }}>
                  Litige déjà tranché.
                </p>
              )}
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
