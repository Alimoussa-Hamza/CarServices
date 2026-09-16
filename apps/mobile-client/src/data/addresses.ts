import type { Address, CreateAddressInput } from '@carservice/shared-types';
import { api, ApiError } from '@carservice/api-client';
import { env, parseUseMocks } from '../config/env';
import { bootstrapApiClient } from './api-bootstrap';
import { getMockAddressId } from './zones';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

const NOW = '2026-09-10T10:00:00.000Z';

let mockAddresses: Address[] = [
  {
    id: 'c1111111-1111-4111-8111-111111111301',
    label: 'Maison',
    street: '12 rue de la République',
    complement: null,
    city: 'Lyon',
    postalCode: '69001',
    country: 'FR',
    lat: 45.764,
    lng: 4.8357,
    instructions: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'c1111111-1111-4111-8111-111111111302',
    label: 'Bureau',
    street: '45 cours Vitton',
    complement: 'Bât. B',
    city: 'Lyon',
    postalCode: '69006',
    country: 'FR',
    lat: 45.769,
    lng: 4.855,
    instructions: 'Interphone 12',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export function resetMockAddressesForTests(): void {
  mockAddresses = [
    {
      id: 'c1111111-1111-4111-8111-111111111301',
      label: 'Maison',
      street: '12 rue de la République',
      complement: null,
      city: 'Lyon',
      postalCode: '69001',
      country: 'FR',
      lat: 45.764,
      lng: 4.8357,
      instructions: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'c1111111-1111-4111-8111-111111111302',
      label: 'Bureau',
      street: '45 cours Vitton',
      complement: 'Bât. B',
      city: 'Lyon',
      postalCode: '69006',
      country: 'FR',
      lat: 45.769,
      lng: 4.855,
      instructions: 'Interphone 12',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
}

export async function listAddresses(): Promise<Address[]> {
  if (useMocksNow()) {
    return mockAddresses.map((a) => ({ ...a }));
  }
  bootstrapApiClient();
  return api.addresses.list();
}

export async function createAddress(input: CreateAddressInput): Promise<Address> {
  if (useMocksNow()) {
    const now = new Date().toISOString();
    const created: Address = {
      id: 'c1111111-1111-4111-8111-111111111399',
      label: input.label ?? null,
      street: input.street,
      complement: input.complement ?? null,
      city: input.city,
      postalCode: input.postalCode,
      country: input.country ?? 'FR',
      lat: input.lat,
      lng: input.lng,
      instructions: input.instructions ?? null,
      createdAt: now,
      updatedAt: now,
    };
    mockAddresses = [...mockAddresses, created];
    return created;
  }
  bootstrapApiClient();
  return api.addresses.create(input);
}

export async function deleteAddress(addressId: string): Promise<void> {
  if (useMocksNow()) {
    const before = mockAddresses.length;
    mockAddresses = mockAddresses.filter((a) => a.id !== addressId);
    if (mockAddresses.length === before) {
      throw new ApiError('ADDRESS_NOT_FOUND', 'Adresse introuvable.', 404);
    }
    return;
  }
  bootstrapApiClient();
  await api.addresses.remove(addressId);
}

/** Used by booking flow — creates or reuses mock id. */
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
