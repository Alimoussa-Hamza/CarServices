'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@carservice/api-client';
import type { AdminZone, AdminZonePricing } from '@carservice/shared-types';
import { colors, spacing, typography } from '@carservice/ui-tokens';
import { ZonePricingEditor } from '@/components/zone-pricing-editor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createAdminZone,
  fetchAdminZonePricing,
  fetchAdminZones,
  patchAdminZone,
} from '@/lib/api';
import {
  isValidCatalogSlug,
  parseLeadHours,
  parsePriceCoefficient,
  slugifyCatalogName,
} from '@/lib/zones';

export default function ZonesPage() {
  const router = useRouter();
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [pricing, setPricing] = useState<AdminZonePricing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [coeff, setCoeff] = useState('1');
  const [lead, setLead] = useState('2');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const selected = zones.find((zone) => zone.id === selectedId) ?? null;

  async function refresh(preferredId?: string | null) {
    const nextZones = await fetchAdminZones();
    setZones(nextZones);
    const nextId =
      preferredId && nextZones.some((zone) => zone.id === preferredId)
        ? preferredId
        : (nextZones.find((zone) => zone.id === selectedId)?.id ??
          nextZones[0]?.id ??
          null);
    setSelectedId(nextId);
    if (nextId) {
      const zone = nextZones.find((item) => item.id === nextId);
      if (zone) {
        setCoeff(String(zone.priceCoefficient).replace('.', ','));
        setLead(String(zone.minBookingLeadHours));
      }
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await refresh();
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace('/login');
          return;
        }
        setError(
          err instanceof ApiError ? err.message : 'Impossible de charger les zones.',
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

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const zone = zones.find((item) => item.id === selectedId);
    if (zone) {
      setCoeff(String(zone.priceCoefficient).replace('.', ','));
      setLead(String(zone.minBookingLeadHours));
    }
    void fetchAdminZonePricing(selectedId)
      .then(setPricing)
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError ? err.message : 'Pricing zone introuvable.',
        );
      });
  }, [selectedId, zones]);

  if (loading) {
    return <p style={{ color: colors.neutral[700] }}>Chargement zones…</p>;
  }

  if (error && zones.length === 0) {
    return (
      <Card>
        <p style={{ color: colors.semantic.error }}>{error}</p>
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gap: spacing[7] }}>
      <div>
        <h1 style={{ fontSize: typography.size.title }}>Zones</h1>
        <p style={{ color: colors.neutral[700] }}>
          Coefficient, délai mini, polygone existant, pricing par offre.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 320px) 1fr',
          gap: spacing[6],
          alignItems: 'start',
        }}
      >
        <Card>
          <h2 style={{ fontSize: 16, marginBottom: spacing[5] }}>Zones</h2>
          <nav style={{ display: 'grid', gap: spacing[3], marginBottom: spacing[7] }}>
            {zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedId(zone.id)}
                style={{
                  textAlign: 'left',
                  border: `1px solid ${zone.id === selectedId ? colors.brand.primary : colors.neutral[300]}`,
                  backgroundColor:
                    zone.id === selectedId
                      ? colors.brand.primaryLight
                      : colors.neutral[0],
                  borderRadius: 8,
                  padding: spacing[4],
                  cursor: 'pointer',
                }}
              >
                <strong>{zone.name}</strong>
                <div style={{ fontSize: 13, color: colors.neutral[700] }}>
                  ×{zone.priceCoefficient} · {zone.polygon.length} pts
                  {zone.isActive ? '' : ' · off'}
                </div>
              </button>
            ))}
          </nav>
          <div style={{ display: 'grid', gap: spacing[3] }}>
            <Label htmlFor="new-zone">Nouvelle zone (copie polygone)</Label>
            <Input
              id="new-zone"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Villeurbanne"
            />
            <Button
              disabled={busy || !selected}
              onClick={() => {
                if (!selected) {
                  return;
                }
                const slug = slugifyCatalogName(newName);
                if (newName.trim().length < 2 || !isValidCatalogSlug(slug)) {
                  setError('Nom de zone invalide.');
                  return;
                }
                setBusy(true);
                setError(null);
                void createAdminZone({
                  name: newName.trim(),
                  slug,
                  polygon: selected.polygon,
                  isActive: false,
                  priceCoefficient: 1,
                  minBookingLeadHours: selected.minBookingLeadHours,
                })
                  .then(async (created) => {
                    setNewName('');
                    await refresh(created.id);
                  })
                  .catch((err: unknown) => {
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : 'Création zone impossible.',
                    );
                  })
                  .finally(() => setBusy(false));
              }}
            >
              Créer (inactif)
            </Button>
          </div>
        </Card>

        <Card>
          {selected ? (
            <div style={{ display: 'grid', gap: spacing[6] }}>
              <div>
                <h2 style={{ fontSize: 18 }}>{selected.name}</h2>
                <p style={{ color: colors.neutral[700], fontSize: 14 }}>
                  {selected.slug} · {selected.polygon.length} sommets
                </p>
              </div>
              <div style={{ display: 'grid', gap: spacing[4], maxWidth: 280 }}>
                <div>
                  <Label htmlFor="coeff">Coefficient prix</Label>
                  <Input
                    id="coeff"
                    value={coeff}
                    onChange={(event) => setCoeff(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lead">Délai mini (h)</Label>
                  <Input
                    id="lead"
                    value={lead}
                    onChange={(event) => setLead(event.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: spacing[4] }}>
                  <Button
                    disabled={busy}
                    onClick={() => {
                      const coefficient = parsePriceCoefficient(coeff);
                      const hours = parseLeadHours(lead);
                      if (coefficient === null || hours === null) {
                        setError('Coefficient ou délai invalide.');
                        return;
                      }
                      setBusy(true);
                      setError(null);
                      void patchAdminZone(selected.id, {
                        priceCoefficient: coefficient,
                        minBookingLeadHours: hours,
                      })
                        .then(() => refresh(selected.id))
                        .catch((err: unknown) => {
                          setError(
                            err instanceof ApiError
                              ? err.message
                              : 'Mise à jour zone impossible.',
                          );
                        })
                        .finally(() => setBusy(false));
                    }}
                  >
                    Enregistrer
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      setBusy(true);
                      void patchAdminZone(selected.id, {
                        isActive: !selected.isActive,
                      })
                        .then(() => refresh(selected.id))
                        .catch((err: unknown) => {
                          setError(
                            err instanceof ApiError
                              ? err.message
                              : 'Activation zone impossible.',
                          );
                        })
                        .finally(() => setBusy(false));
                    }}
                  >
                    {selected.isActive ? 'Désactiver' : 'Activer'}
                  </Button>
                </div>
              </div>
              <ZonePricingEditor
                zone={selected}
                rows={pricing}
                onChanged={() => refresh(selected.id)}
              />
            </div>
          ) : (
            <p style={{ color: colors.neutral[700] }}>Aucune zone.</p>
          )}
          {error ? (
            <p style={{ color: colors.semantic.error, fontSize: 14, marginTop: spacing[5] }}>
              {error}
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
