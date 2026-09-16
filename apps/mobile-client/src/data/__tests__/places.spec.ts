import { searchPlaces, resolvePlace } from '../places';

describe('places (mock)', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  it('searchPlaces retourne des suggestions mock', async () => {
    const list = await searchPlaces('Lyon', 'sess_test');
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it('resolvePlace remplit ville + CP', async () => {
    const place = await resolvePlace('mock-lyon-vitton', 'sess_test');
    expect(place.city).toBe('Lyon');
    expect(place.postalCode).toBe('69006');
  });
});
