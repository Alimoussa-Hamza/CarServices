import { api } from '@carservice/api-client';
import { env, parseUseMocks } from '../config/env';
import offersMock from '../mocks/offers.json';
import { bootstrapApiClient } from './api-bootstrap';
import type { HomeOffer } from './home-types';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

export async function listHomeOffers(zone = 'lyon'): Promise<HomeOffer[]> {
  if (useMocksNow()) {
    return offersMock.map((o) => ({
      id: o.id,
      name: o.name,
      priceCents: o.priceCents,
      durationMinutes: o.durationMinutes,
      description: o.description,
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
  }));
}
