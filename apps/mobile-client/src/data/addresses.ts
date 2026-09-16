import { api } from '@carservice/api-client';
import { env, parseUseMocks } from '../config/env';
import { bootstrapApiClient } from './api-bootstrap';
import { getMockAddressId } from './zones';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

export async function resolveBookingAddressId(input: {
  line1: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
}): Promise<string> {
  if (useMocksNow()) {
    return getMockAddressId();
  }

  bootstrapApiClient();
  const created = await api.addresses.create({
    street: input.line1,
    city: input.city,
    postalCode: input.postalCode,
    lat: input.lat,
    lng: input.lng,
    country: 'FR',
    label: 'Réservation',
  });
  return created.id;
}
