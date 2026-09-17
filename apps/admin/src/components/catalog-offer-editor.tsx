'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@carservice/api-client';
import type { AdminOffer } from '@carservice/shared-types';
import { colors, spacing } from '@carservice/ui-tokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createAdminOfferOption,
  patchAdminOffer,
  patchAdminOfferOption,
} from '@/lib/api';
import {
  euroInputFromCents,
  isValidCatalogSlug,
  parseCentsFromEuroInput,
  parsePositiveInt,
  slugifyCatalogName,
} from '@/lib/catalog';
import { formatEurFromCents } from '@/lib/format';

export function CatalogOfferEditor({
  offer,
  onChanged,
}: {
  offer: AdminOffer;
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState(offer.name);
  const [price, setPrice] = useState(euroInputFromCents(offer.basePriceCents));
  const [duration, setDuration] = useState(String(offer.durationMinutes));
  const [optionName, setOptionName] = useState('');
  const [optionPrice, setOptionPrice] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(offer.name);
    setPrice(euroInputFromCents(offer.basePriceCents));
    setDuration(String(offer.durationMinutes));
    setOptionName('');
    setOptionPrice('0');
    setError(null);
  }, [offer.id, offer.name, offer.basePriceCents, offer.durationMinutes]);

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action catalogue impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: spacing[6] }}>
      <div style={{ display: 'grid', gap: spacing[4], maxWidth: 420 }}>
        <div>
          <Label htmlFor="offer-name">Nom</Label>
          <Input
            id="offer-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="offer-price">Prix TTC (€)</Label>
          <Input
            id="offer-price"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="offer-duration">Durée (min)</Label>
          <Input
            id="offer-duration"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: spacing[4] }}>
          <Button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const cents = parseCentsFromEuroInput(price);
                const minutes = parsePositiveInt(duration);
                if (name.trim().length < 2 || cents === null || minutes === null) {
                  throw new ApiError(
                    'VALIDATION_ERROR',
                    'Nom, prix et durée invalides.',
                    400,
                  );
                }
                await patchAdminOffer(offer.id, {
                  name: name.trim(),
                  basePriceCents: cents,
                  durationMinutes: minutes,
                });
              })
            }
          >
            Enregistrer
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await patchAdminOffer(offer.id, { isActive: !offer.isActive });
              })
            }
          >
            {offer.isActive ? 'Désactiver' : 'Activer'}
          </Button>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 15, marginBottom: spacing[4] }}>Options</h3>
        <ul style={{ display: 'grid', gap: spacing[3], marginBottom: spacing[5] }}>
          {offer.options.map((option) => (
            <li
              key={option.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: spacing[4],
                alignItems: 'center',
                fontSize: 14,
              }}
            >
              <span>
                {option.name} · {formatEurFromCents(option.priceDeltaCents)} ·{' '}
                {option.isActive ? 'active' : 'off'}
              </span>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await patchAdminOfferOption(option.id, {
                      isActive: !option.isActive,
                    });
                  })
                }
              >
                {option.isActive ? 'Off' : 'On'}
              </Button>
            </li>
          ))}
        </ul>
        <div style={{ display: 'grid', gap: spacing[3], maxWidth: 420 }}>
          <div>
            <Label htmlFor="option-name">Nouvelle option</Label>
            <Input
              id="option-name"
              value={optionName}
              onChange={(event) => setOptionName(event.target.value)}
              placeholder="Poils d’animaux"
            />
          </div>
          <div>
            <Label htmlFor="option-price">Supplément (€)</Label>
            <Input
              id="option-price"
              value={optionPrice}
              onChange={(event) => setOptionPrice(event.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const cents = parseCentsFromEuroInput(optionPrice);
                const slug = slugifyCatalogName(optionName);
                if (
                  optionName.trim().length < 2 ||
                  cents === null ||
                  !isValidCatalogSlug(slug)
                ) {
                  throw new ApiError(
                    'VALIDATION_ERROR',
                    'Option : nom et prix requis.',
                    400,
                  );
                }
                await createAdminOfferOption(offer.id, {
                  slug,
                  name: optionName.trim(),
                  priceDeltaCents: cents,
                  durationDeltaMinutes: 0,
                  isActive: true,
                });
                setOptionName('');
                setOptionPrice('0');
              })
            }
          >
            Ajouter l’option
          </Button>
        </div>
      </div>

      {error ? (
        <p style={{ color: colors.semantic.error, fontSize: 14 }}>{error}</p>
      ) : null}
    </div>
  );
}
