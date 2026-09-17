'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@carservice/api-client';
import type { AdminZone, AdminZonePricing } from '@carservice/shared-types';
import { colors, spacing } from '@carservice/ui-tokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { putAdminZonePricing } from '@/lib/api';
import { euroInputFromCents } from '@/lib/catalog';
import {
  parseOptionalCents,
  VEHICLE_SURCHARGE_KEYS,
  vehicleSurchargeLabel,
} from '@/lib/zones';

function surchargeInputs(row: AdminZonePricing): Record<string, string> {
  const next: Record<string, string> = {};
  for (const key of VEHICLE_SURCHARGE_KEYS) {
    next[key] = euroInputFromCents(row.vehicleSurcharges[key]);
  }
  return next;
}

export function ZonePricingEditor({
  zone,
  rows,
  onChanged,
}: {
  zone: AdminZone;
  rows: AdminZonePricing[];
  onChanged: () => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<
    Record<string, { override: string; surcharges: Record<string, string> }>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<
      string,
      { override: string; surcharges: Record<string, string> }
    > = {};
    for (const row of rows) {
      next[row.offerId] = {
        override:
          row.priceOverrideCents === null
            ? ''
            : euroInputFromCents(row.priceOverrideCents),
        surcharges: surchargeInputs(row),
      };
    }
    setDrafts(next);
    setError(null);
  }, [zone.id, rows]);

  return (
    <div style={{ display: 'grid', gap: spacing[6] }}>
      <h3 style={{ fontSize: 15 }}>Pricing par offre</h3>
      {rows.map((row) => {
        const draft = drafts[row.offerId];
        if (!draft) {
          return null;
        }
        return (
          <div
            key={row.offerId}
            style={{
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: 8,
              padding: spacing[5],
              display: 'grid',
              gap: spacing[4],
            }}
          >
            <strong>{row.offerName}</strong>
            <div>
              <Label htmlFor={`override-${row.offerId}`}>
                Prix override (€, vide = catalogue)
              </Label>
              <Input
                id={`override-${row.offerId}`}
                value={draft.override}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [row.offerId]: {
                      ...draft,
                      override: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: spacing[3],
              }}
            >
              {VEHICLE_SURCHARGE_KEYS.map((key) => (
                <div key={key}>
                  <Label htmlFor={`${row.offerId}-${key}`}>
                    {vehicleSurchargeLabel(key)}
                  </Label>
                  <Input
                    id={`${row.offerId}-${key}`}
                    value={draft.surcharges[key] ?? '0'}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [row.offerId]: {
                          ...draft,
                          surcharges: {
                            ...draft.surcharges,
                            [key]: event.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <Button
              disabled={busyId !== null}
              onClick={() => {
                const override = parseOptionalCents(draft.override);
                if (!override.ok) {
                  setError('Override invalide.');
                  return;
                }
                const vehicleSurcharges = {
                  citadine: 0,
                  berline: 0,
                  suv: 0,
                  utilitaire: 0,
                  moto: 0,
                };
                for (const key of VEHICLE_SURCHARGE_KEYS) {
                  const raw = draft.surcharges[key]?.trim()
                    ? (draft.surcharges[key] ?? '0')
                    : '0';
                  const parsed = parseOptionalCents(raw);
                  if (!parsed.ok || parsed.cents === null) {
                    setError(`Surcharge ${vehicleSurchargeLabel(key)} invalide.`);
                    return;
                  }
                  vehicleSurcharges[key] = parsed.cents;
                }
                setBusyId(row.offerId);
                setError(null);
                void putAdminZonePricing(zone.id, row.offerId, {
                  priceOverrideCents: override.cents,
                  vehicleSurcharges,
                })
                  .then(() => onChanged())
                  .catch((err: unknown) => {
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : 'Enregistrement pricing impossible.',
                    );
                  })
                  .finally(() => setBusyId(null));
              }}
            >
              Enregistrer
            </Button>
          </div>
        );
      })}
      {error ? (
        <p style={{ color: colors.semantic.error, fontSize: 14 }}>{error}</p>
      ) : null}
    </div>
  );
}
