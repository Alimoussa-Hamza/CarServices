'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@carservice/api-client';
import type { AdminCategory, AdminOffer } from '@carservice/shared-types';
import { colors, spacing, typography } from '@carservice/ui-tokens';
import { CatalogOfferEditor } from '@/components/catalog-offer-editor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createAdminOffer,
  fetchAdminCategories,
  fetchAdminOffers,
  patchAdminCategory,
} from '@/lib/api';
import {
  EMPTY_OFFER_CHECKLIST,
  EMPTY_OFFER_FORM_SCHEMA,
  isValidCatalogSlug,
  parseCentsFromEuroInput,
  parsePositiveInt,
  slugifyCatalogName,
} from '@/lib/catalog';
import { formatEurFromCents } from '@/lib/format';

export default function CatalogPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('89,00');
  const [newDuration, setNewDuration] = useState('90');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [nextCategories, nextOffers] = await Promise.all([
      fetchAdminCategories(),
      fetchAdminOffers(),
    ]);
    setCategories(nextCategories);
    setOffers(nextOffers);
    setSelectedId((current) => {
      if (current && nextOffers.some((offer) => offer.id === current)) {
        return current;
      }
      return nextOffers[0]?.id ?? null;
    });
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
          err instanceof ApiError ? err.message : 'Impossible de charger le catalogue.',
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

  const selected = offers.find((offer) => offer.id === selectedId) ?? null;
  const defaultCategoryId = categories[0]?.id;

  if (loading) {
    return <p style={{ color: colors.neutral[700] }}>Chargement catalogue…</p>;
  }

  if (error) {
    return (
      <Card>
        <p style={{ color: colors.semantic.error }}>{error}</p>
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gap: spacing[7] }}>
      <div>
        <h1 style={{ fontSize: typography.size.title }}>Catalogue</h1>
        <p style={{ color: colors.neutral[700] }}>
          Catégories, offres et options (soft-disable, pas de suppression).
        </p>
      </div>

      <Card>
        <h2 style={{ fontSize: 16, marginBottom: spacing[5] }}>Catégories</h2>
        <ul style={{ display: 'grid', gap: spacing[4] }}>
          {categories.map((category) => (
            <li
              key={category.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: spacing[4],
              }}
            >
              <span>
                {category.name}{' '}
                <span style={{ color: colors.neutral[500], fontSize: 13 }}>
                  ({category.slug})
                </span>
              </span>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void patchAdminCategory(category.id, {
                    isEnabled: !category.isEnabled,
                  })
                    .then(() => refresh())
                    .catch((err: unknown) => {
                      setError(
                        err instanceof ApiError
                          ? err.message
                          : 'Mise à jour catégorie impossible.',
                      );
                    })
                    .finally(() => setBusy(false));
                }}
              >
                {category.isEnabled ? 'Désactiver' : 'Activer'}
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 340px) 1fr',
          gap: spacing[6],
          alignItems: 'start',
        }}
      >
        <Card>
          <h2 style={{ fontSize: 16, marginBottom: spacing[5] }}>Offres</h2>
          <nav style={{ display: 'grid', gap: spacing[3], marginBottom: spacing[7] }}>
            {offers.map((offer) => (
              <button
                key={offer.id}
                type="button"
                onClick={() => setSelectedId(offer.id)}
                style={{
                  textAlign: 'left',
                  border: `1px solid ${offer.id === selectedId ? colors.brand.primary : colors.neutral[300]}`,
                  backgroundColor:
                    offer.id === selectedId
                      ? colors.brand.primaryLight
                      : colors.neutral[0],
                  borderRadius: 8,
                  padding: spacing[4],
                  cursor: 'pointer',
                }}
              >
                <strong>{offer.name}</strong>
                <div style={{ fontSize: 13, color: colors.neutral[700] }}>
                  {formatEurFromCents(offer.basePriceCents)} · {offer.durationMinutes} min
                  {offer.isActive ? '' : ' · off'}
                </div>
              </button>
            ))}
          </nav>

          <h3 style={{ fontSize: 14, marginBottom: spacing[4] }}>Nouvelle offre</h3>
          <div style={{ display: 'grid', gap: spacing[3] }}>
            <div>
              <Label htmlFor="new-offer-name">Nom</Label>
              <Input
                id="new-offer-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new-offer-price">Prix (€)</Label>
              <Input
                id="new-offer-price"
                value={newPrice}
                onChange={(event) => setNewPrice(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new-offer-duration">Durée (min)</Label>
              <Input
                id="new-offer-duration"
                value={newDuration}
                onChange={(event) => setNewDuration(event.target.value)}
              />
            </div>
            <Button
              disabled={busy || !defaultCategoryId}
              onClick={() => {
                const slug = slugifyCatalogName(newName);
                const cents = parseCentsFromEuroInput(newPrice);
                const minutes = parsePositiveInt(newDuration);
                if (
                  !defaultCategoryId ||
                  newName.trim().length < 2 ||
                  !isValidCatalogSlug(slug) ||
                  cents === null ||
                  minutes === null
                ) {
                  setError('Nouvelle offre : nom, prix et durée invalides.');
                  return;
                }
                setBusy(true);
                setError(null);
                void createAdminOffer({
                  categoryId: defaultCategoryId,
                  slug,
                  name: newName.trim(),
                  basePriceCents: cents,
                  durationMinutes: minutes,
                  formSchema: EMPTY_OFFER_FORM_SCHEMA,
                  checklistTemplate: EMPTY_OFFER_CHECKLIST,
                  isActive: true,
                  sortOrder: offers.length,
                })
                  .then(async (created) => {
                    setNewName('');
                    await refresh();
                    setSelectedId(created.id);
                  })
                  .catch((err: unknown) => {
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : 'Création offre impossible.',
                    );
                  })
                  .finally(() => setBusy(false));
              }}
            >
              Créer
            </Button>
          </div>
        </Card>

        <Card>
          {selected ? (
            <CatalogOfferEditor
              key={selected.id}
              offer={selected}
              onChanged={refresh}
            />
          ) : (
            <p style={{ color: colors.neutral[700] }}>Aucune offre.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
