import {
  BOOKING_GEOFENCE_METERS,
  BOOKING_MIN_AFTER_PHOTOS,
  BOOKING_MIN_BEFORE_PHOTOS,
} from '@carservice/shared-types';
import { haversineKm } from './matching-rules';

export function distanceMeters(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): number {
  return haversineKm(origin.lat, origin.lng, destination.lat, destination.lng) * 1000;
}

export function isWithinGeofence(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  maxMeters = BOOKING_GEOFENCE_METERS,
): boolean {
  return distanceMeters(origin, destination) <= maxMeters;
}

export function hasMinCompletionPhotos(
  photos: Array<{ photoType: string; uploadedBy: string }>,
  minBefore = BOOKING_MIN_BEFORE_PHOTOS,
  minAfter = BOOKING_MIN_AFTER_PHOTOS,
): boolean {
  const before = photos.filter(
    (photo) => photo.uploadedBy === 'provider' && photo.photoType === 'before',
  ).length;
  const after = photos.filter(
    (photo) => photo.uploadedBy === 'provider' && photo.photoType === 'after',
  ).length;

  return before >= minBefore && after >= minAfter;
}
