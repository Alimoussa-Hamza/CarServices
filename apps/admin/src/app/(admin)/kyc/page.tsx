'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@carservice/api-client';
import type { AdminPendingProvider } from '@carservice/shared-types';
import { colors, spacing, typography } from '@carservice/ui-tokens';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  approvePendingKyc,
  fetchPendingKyc,
  rejectPendingKyc,
} from '@/lib/api';
import {
  formatKycDocType,
  formatWashMethods,
  isImageDocumentUrl,
  parseKycRejectReason,
} from '@/lib/kyc';

export default function KycPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminPendingProvider[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load(preferredId?: string | null) {
    const response = await fetchPendingKyc();
    setItems(response.items);
    setSelectedId((current) => {
      if (preferredId && response.items.some((item) => item.id === preferredId)) {
        return preferredId;
      }
      return response.items[0]?.id ?? null;
    });
  }

  useEffect(() => {
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
          err instanceof ApiError ? err.message : 'Impossible de charger la file KYC.',
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
  }, [router]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  async function onApprove() {
    if (!selected) {
      return;
    }
    setActionError(null);
    setBusy(true);
    try {
      await approvePendingKyc(selected.id);
      setReason('');
      await load(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'Approbation impossible.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function onReject() {
    if (!selected) {
      return;
    }
    const parsed = parseKycRejectReason(reason);
    if (!parsed) {
      setActionError('Motif requis (5 caractères minimum).');
      return;
    }
    setActionError(null);
    setBusy(true);
    try {
      await rejectPendingKyc(selected.id, parsed);
      setReason('');
      await load(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'Rejet impossible.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p style={{ color: colors.neutral[700] }}>Chargement KYC…</p>;
  }

  if (error) {
    return (
      <Card>
        <p style={{ color: colors.semantic.error }}>{error}</p>
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gap: spacing[6] }}>
      <div>
        <h1 style={{ fontSize: typography.size.title }}>KYC pros</h1>
        <p style={{ color: colors.neutral[700] }}>
          Dossiers `submitted` · {items.length} en attente
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <p style={{ color: colors.neutral[700] }}>Aucun dossier en attente.</p>
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
                    <strong>
                      {item.companyName ?? item.phone}
                    </strong>
                    <div style={{ fontSize: 13, color: colors.neutral[700] }}>
                      {item.siret ?? 'SIRET —'}
                    </div>
                  </button>
                );
              })}
            </nav>
          </Card>

          {selected ? (
            <Card>
              <h2 style={{ fontSize: 18, marginBottom: spacing[4] }}>
                {selected.companyName ?? 'Pro sans raison sociale'}
              </h2>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  rowGap: spacing[3],
                  fontSize: 14,
                  marginBottom: spacing[7],
                }}
              >
                <dt style={{ color: colors.neutral[500] }}>Téléphone</dt>
                <dd>{selected.phone}</dd>
                <dt style={{ color: colors.neutral[500] }}>Email</dt>
                <dd>{selected.email ?? '—'}</dd>
                <dt style={{ color: colors.neutral[500] }}>SIRET</dt>
                <dd>{selected.siret ?? '—'}</dd>
                <dt style={{ color: colors.neutral[500] }}>Méthodes</dt>
                <dd>{formatWashMethods(selected.washMethods)}</dd>
                <dt style={{ color: colors.neutral[500] }}>Soumis</dt>
                <dd>
                  {new Date(selected.submittedAt).toLocaleString('fr-FR')}
                </dd>
              </dl>

              <h3 style={{ fontSize: 15, marginBottom: spacing[4] }}>
                Documents
              </h3>
              <div style={{ display: 'grid', gap: spacing[5], marginBottom: spacing[8] }}>
                {selected.documents.length === 0 ? (
                  <p style={{ color: colors.neutral[700] }}>Aucun document.</p>
                ) : (
                  selected.documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        border: `1px solid ${colors.neutral[300]}`,
                        borderRadius: 8,
                        padding: spacing[4],
                      }}
                    >
                      <p style={{ fontWeight: 600 }}>
                        {formatKycDocType(doc.docType)}
                        {doc.expiresAt ? ` · exp. ${doc.expiresAt}` : ''}
                      </p>
                      {isImageDocumentUrl(doc.fileUrl) ? (
                        <img
                          src={doc.fileUrl}
                          alt={formatKycDocType(doc.docType)}
                          style={{
                            marginTop: spacing[3],
                            maxWidth: '100%',
                            maxHeight: 320,
                            borderRadius: 8,
                          }}
                        />
                      ) : null}
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-block',
                          marginTop: spacing[3],
                          color: colors.brand.primary,
                        }}
                      >
                        Ouvrir le fichier
                      </a>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'grid', gap: spacing[4], maxWidth: 480 }}>
                <div>
                  <Label htmlFor="reject-reason">Motif de rejet</Label>
                  <Input
                    id="reject-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Ex. RC Pro illisible"
                  />
                </div>
                {actionError ? (
                  <p style={{ color: colors.semantic.error, fontSize: 14 }}>
                    {actionError}
                  </p>
                ) : null}
                <div style={{ display: 'flex', gap: spacing[4] }}>
                  <Button onClick={() => void onApprove()} disabled={busy}>
                    Approuver
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void onReject()}
                    disabled={busy}
                  >
                    Refuser
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
