import { BOOKING_GEOFENCE_METERS } from '@carservice/shared-types';
import {
  hasMinCompletionPhotos,
  isWithinGeofence,
} from '../booking-execution';

const LYON = { lat: 45.764, lng: 4.8357 };

describe('booking-execution', () => {
  it('accepte une position à l’adresse (RG-BOOK-03)', () => {
    expect(isWithinGeofence(LYON, LYON)).toBe(true);
  });

  it('accepte ~50 m et refuse ~2 km', () => {
    const nearby = { lat: 45.7644, lng: 4.8357 };
    const far = { lat: 45.78, lng: 4.85 };

    expect(isWithinGeofence(nearby, LYON, BOOKING_GEOFENCE_METERS)).toBe(true);
    expect(isWithinGeofence(far, LYON, BOOKING_GEOFENCE_METERS)).toBe(false);
  });

  it('exige 2 photos before et 2 after du pro (RG-BOOK-04)', () => {
    expect(hasMinCompletionPhotos([])).toBe(false);
    expect(
      hasMinCompletionPhotos([
        { photoType: 'before', uploadedBy: 'provider' },
        { photoType: 'after', uploadedBy: 'provider' },
      ]),
    ).toBe(false);
    expect(
      hasMinCompletionPhotos([
        { photoType: 'before', uploadedBy: 'client' },
        { photoType: 'before', uploadedBy: 'client' },
        { photoType: 'after', uploadedBy: 'client' },
        { photoType: 'after', uploadedBy: 'client' },
      ]),
    ).toBe(false);
    expect(
      hasMinCompletionPhotos([
        { photoType: 'before', uploadedBy: 'provider' },
        { photoType: 'before', uploadedBy: 'provider' },
        { photoType: 'after', uploadedBy: 'provider' },
        { photoType: 'after', uploadedBy: 'provider' },
      ]),
    ).toBe(true);
  });
});
