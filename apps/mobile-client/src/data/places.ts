import { env, parseUseMocks } from '../config/env';
import {
  createPlacesSessionToken,
  filterMockSuggestions,
  mapAutocompletePredictions,
  parseGooglePlaceDetails,
  resolveMockPlace,
  type PlaceSuggestion,
  type ResolvedPlace,
} from '../lib/places-parse';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

function useGooglePlaces(): boolean {
  return Boolean(env.googlePlacesKey) && !useMocksNow();
}

export type { PlaceSuggestion, ResolvedPlace };
export { createPlacesSessionToken };

export async function searchPlaces(
  query: string,
  sessionToken: string,
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }

  if (!useGooglePlaces()) {
    return filterMockSuggestions(q);
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', q);
  url.searchParams.set('key', env.googlePlacesKey);
  url.searchParams.set('language', 'fr');
  url.searchParams.set('components', 'country:fr');
  url.searchParams.set('sessiontoken', sessionToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Places autocomplete indisponible.');
  }
  const json = (await res.json()) as {
    status: string;
    predictions?: {
      place_id: string;
      structured_formatting?: { main_text?: string; secondary_text?: string };
      description?: string;
    }[];
    error_message?: string;
  };
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(json.error_message ?? `Places error: ${json.status}`);
  }
  return mapAutocompletePredictions(json.predictions ?? []);
}

export async function resolvePlace(
  placeId: string,
  sessionToken: string,
): Promise<ResolvedPlace> {
  if (!useGooglePlaces()) {
    const mock = resolveMockPlace(placeId);
    if (!mock) {
      throw new Error('Adresse introuvable.');
    }
    return mock;
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('key', env.googlePlacesKey);
  url.searchParams.set('language', 'fr');
  url.searchParams.set('fields', 'address_component,geometry,formatted_address');
  url.searchParams.set('sessiontoken', sessionToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Détail adresse indisponible.');
  }
  const json = (await res.json()) as {
    status: string;
    result?: Parameters<typeof parseGooglePlaceDetails>[0];
    error_message?: string;
  };
  if (json.status !== 'OK' || !json.result) {
    throw new Error(json.error_message ?? 'Adresse introuvable.');
  }
  const parsed = parseGooglePlaceDetails(json.result);
  if (!parsed) {
    throw new Error('Adresse incomplète (rue / ville / CP).');
  }
  return parsed;
}
