import { api } from '@carservice/api-client';
import type { CatalogQuoteDto, CatalogQuoteResponse } from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import offersMock from '../mocks/offers.json';
import quoteMock from '../mocks/quote.json';
import { bootstrapApiClient } from './api-bootstrap';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

/** Build mock quote from offer + selected options (fixture assembly, not pricing rules). */
export function buildMockQuote(input: {
  offerId: string;
  optionIds: string[];
}): CatalogQuoteResponse {
  const offer = offersMock.find((o) => o.id === input.offerId);
  if (!offer) {
    return quoteMock as CatalogQuoteResponse;
  }

  const selected = offer.options.filter((o) => input.optionIds.includes(o.id));
  const optionsAmount = selected.reduce((sum, o) => sum + o.priceDeltaCents, 0);
  const durationExtra = selected.reduce((sum, o) => sum + o.durationDeltaMinutes, 0);
  const serviceFee = quoteMock.breakdown.serviceFee;

  return {
    breakdown: {
      base: offer.priceCents,
      vehicleSurcharge: 0,
      options: selected.map((o) => ({
        id: o.id,
        name: o.name,
        amount: o.priceDeltaCents,
      })),
      serviceFee,
      totalCents: offer.priceCents + optionsAmount + serviceFee,
      currency: 'EUR',
    },
    durationMinutes: offer.durationMinutes + durationExtra,
  };
}

export async function fetchQuote(dto: CatalogQuoteDto): Promise<CatalogQuoteResponse> {
  if (useMocksNow()) {
    return buildMockQuote({ offerId: dto.offerId, optionIds: dto.optionIds ?? [] });
  }

  bootstrapApiClient();
  return api.catalog.quote(dto);
}
