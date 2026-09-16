import {
  filterMockSuggestions,
  mapAutocompletePredictions,
  parseGooglePlaceDetails,
  resolveMockPlace,
} from '../places-parse';

describe('places-parse', () => {
  it('filtre les suggestions mock Lyon', () => {
    const hits = filterMockSuggestions('république');
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits[0]?.placeId).toBe('mock-lyon-republique');
  });

  it('ignore requêtes trop courtes', () => {
    expect(filterMockSuggestions('r')).toEqual([]);
  });

  it('résout un placeId mock', () => {
    const place = resolveMockPlace('mock-lyon-bellecour');
    expect(place?.postalCode).toBe('69002');
    expect(place?.city).toBe('Lyon');
  });

  it('mappe les predictions Google', () => {
    const mapped = mapAutocompletePredictions([
      {
        place_id: 'abc',
        structured_formatting: { main_text: 'Rue X', secondary_text: 'Lyon' },
      },
    ]);
    expect(mapped[0]).toEqual({
      placeId: 'abc',
      primaryText: 'Rue X',
      secondaryText: 'Lyon',
    });
  });

  it('parse Place Details Google', () => {
    const parsed = parseGooglePlaceDetails({
      formatted_address: '12 rue de la République, 69001 Lyon, France',
      geometry: { location: { lat: 45.76, lng: 4.83 } },
      address_components: [
        { long_name: '12', short_name: '12', types: ['street_number'] },
        { long_name: 'rue de la République', short_name: 'rue de la République', types: ['route'] },
        { long_name: 'Lyon', short_name: 'Lyon', types: ['locality'] },
        { long_name: '69001', short_name: '69001', types: ['postal_code'] },
      ],
    });
    expect(parsed).toMatchObject({
      line1: '12 rue de la République',
      city: 'Lyon',
      postalCode: '69001',
      lat: 45.76,
      lng: 4.83,
    });
  });
});
