import { api, ApiError } from '@carservice/api-client';
import type { ZoneCheckDto, ZoneCheckResponse } from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import { bootstrapApiClient } from './api-bootstrap';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

const MOCK_ADDRESS_ID = 'c1111111-1111-4111-8111-111111111301';
const LYON_ZONE = {
  id: 'd1111111-1111-4111-8111-111111111401',
  name: 'Lyon',
  slug: 'lyon',
};

/** Mock coverage: postal 69* or coords near Lyon. */
export function isMockZoneCovered(dto: ZoneCheckDto): boolean {
  if (dto.postalCode?.startsWith('69')) {
    return true;
  }
  const nearLyon =
    Math.abs(dto.lat - 45.764) < 0.15 && Math.abs(dto.lng - 4.836) < 0.15;
  return nearLyon;
}

export async function checkZone(dto: ZoneCheckDto): Promise<ZoneCheckResponse> {
  if (useMocksNow()) {
    if (isMockZoneCovered(dto)) {
      return { covered: true, zone: LYON_ZONE };
    }
    return { covered: false, leadCaptured: false };
  }

  bootstrapApiClient();
  return api.zones.check(dto);
}

export function getMockAddressId(): string {
  return MOCK_ADDRESS_ID;
}

export async function createOutOfZoneLead(input: {
  email?: string;
  addressText: string;
  lat: number;
  lng: number;
}): Promise<void> {
  if (useMocksNow()) {
    if (!input.email && !input.addressText) {
      throw new ApiError('VALIDATION_ERROR', 'Email ou adresse requis', 400);
    }
    return;
  }

  bootstrapApiClient();
  await api.zones.createLead({
    email: input.email,
    addressText: input.addressText,
    lat: input.lat,
    lng: input.lng,
  });
}
