export type PlaceSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
};

export type ResolvedPlace = {
  line1: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
  formattedAddress: string;
};

const MOCK_SUGGESTIONS: PlaceSuggestion[] = [
  {
    placeId: 'mock-lyon-republique',
    primaryText: '12 rue de la République',
    secondaryText: '69001 Lyon, France',
  },
  {
    placeId: 'mock-lyon-vitton',
    primaryText: '45 cours Vitton',
    secondaryText: '69006 Lyon, France',
  },
  {
    placeId: 'mock-lyon-bellecour',
    primaryText: 'Place Bellecour',
    secondaryText: '69002 Lyon, France',
  },
  {
    placeId: 'mock-paris-rivoli',
    primaryText: '10 rue de Rivoli',
    secondaryText: '75001 Paris, France',
  },
];

const MOCK_DETAILS: Record<string, ResolvedPlace> = {
  'mock-lyon-republique': {
    line1: '12 rue de la République',
    city: 'Lyon',
    postalCode: '69001',
    lat: 45.764,
    lng: 4.8357,
    formattedAddress: '12 rue de la République, 69001 Lyon, France',
  },
  'mock-lyon-vitton': {
    line1: '45 cours Vitton',
    city: 'Lyon',
    postalCode: '69006',
    lat: 45.769,
    lng: 4.855,
    formattedAddress: '45 cours Vitton, 69006 Lyon, France',
  },
  'mock-lyon-bellecour': {
    line1: 'Place Bellecour',
    city: 'Lyon',
    postalCode: '69002',
    lat: 45.7578,
    lng: 4.832,
    formattedAddress: 'Place Bellecour, 69002 Lyon, France',
  },
  'mock-paris-rivoli': {
    line1: '10 rue de Rivoli',
    city: 'Paris',
    postalCode: '75001',
    lat: 48.8606,
    lng: 2.3376,
    formattedAddress: '10 rue de Rivoli, 75001 Paris, France',
  },
};

export function filterMockSuggestions(query: string): PlaceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    return [];
  }
  return MOCK_SUGGESTIONS.filter(
    (s) =>
      s.primaryText.toLowerCase().includes(q) ||
      s.secondaryText.toLowerCase().includes(q),
  );
}

export function resolveMockPlace(placeId: string): ResolvedPlace | null {
  return MOCK_DETAILS[placeId] ?? null;
}

type AutocompletePrediction = {
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  description?: string;
};

type PlaceDetailsResult = {
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  address_components?: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
};

function component(
  components: PlaceDetailsResult['address_components'],
  type: string,
  short = false,
): string {
  const hit = components?.find((c) => c.types.includes(type));
  if (!hit) {
    return '';
  }
  return short ? hit.short_name : hit.long_name;
}

/** Pure parser — unit-tested without network. */
export function parseGooglePlaceDetails(result: PlaceDetailsResult): ResolvedPlace | null {
  const lat = result.geometry?.location?.lat;
  const lng = result.geometry?.location?.lng;
  if (lat == null || lng == null) {
    return null;
  }
  const streetNumber = component(result.address_components, 'street_number');
  const route = component(result.address_components, 'route');
  const line1 = [streetNumber, route].filter(Boolean).join(' ').trim()
    || result.formatted_address?.split(',')[0]?.trim()
    || '';
  const city =
    component(result.address_components, 'locality')
    || component(result.address_components, 'postal_town')
    || '';
  const postalCode = component(result.address_components, 'postal_code');
  if (!line1 || !city || !postalCode) {
    return null;
  }
  return {
    line1,
    city,
    postalCode,
    lat,
    lng,
    formattedAddress: result.formatted_address ?? `${line1}, ${postalCode} ${city}`,
  };
}

export function mapAutocompletePredictions(
  predictions: AutocompletePrediction[],
): PlaceSuggestion[] {
  return predictions.map((p) => ({
    placeId: p.place_id,
    primaryText: p.structured_formatting?.main_text ?? p.description ?? p.place_id,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
  }));
}

export function createPlacesSessionToken(): string {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
