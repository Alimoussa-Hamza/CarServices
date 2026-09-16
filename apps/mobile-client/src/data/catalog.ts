import { api } from '@carservice/api-client';
import type { OfferOptionDto } from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import offersMock from '../mocks/offers.json';
import { bootstrapApiClient } from './api-bootstrap';
import type { HomeOffer } from './home-types';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

export type BookingOffer = HomeOffer & {
  options: OfferOptionDto[];
};

export async function listHomeOffers(zone = 'lyon'): Promise<HomeOffer[]> {
  const offers = await listBookingOffers(zone);
  return offers.map(({ options: _options, ...rest }) => rest);
}

export async function listBookingOffers(zone = 'lyon'): Promise<BookingOffer[]> {
  if (useMocksNow()) {
    return offersMock.map((o) => ({
      id: o.id,
      name: o.name,
      priceCents: o.priceCents,
      durationMinutes: o.durationMinutes,
      description: o.description,
      options: o.options.map((opt) => ({
        id: opt.id,
        slug: opt.slug,
        name: opt.name,
        priceDeltaCents: opt.priceDeltaCents,
        durationDeltaMinutes: opt.durationDeltaMinutes,
      })),
    }));
  }

  bootstrapApiClient();
  const offers = await api.catalog.offers(zone);
  return offers.map((o) => ({
    id: o.id,
    name: o.name,
    priceCents: o.basePriceCents,
    durationMinutes: o.durationMinutes,
    description: o.description ?? '',
    options: o.options,
  }));
}
