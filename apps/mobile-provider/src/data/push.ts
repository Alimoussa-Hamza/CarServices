import type { PushPlatform, RegisteredPushToken, RegisterPushTokenDto } from '@carservice/shared-types';
import { api } from '@carservice/api-client';
import { env, parseUseMocks } from '../config/env';
import { bootstrapApiClient } from './api-bootstrap';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

export const MOCK_EXPO_PUSH_TOKEN = 'ExponentPushToken[mockproviderxxxxxxxxxx]';

export function buildMockRegisteredPushToken(
  dto: RegisterPushTokenDto,
): RegisteredPushToken {
  return {
    id: 'd1111111-1111-4111-8111-111111111801',
    token: dto.token,
    platform: dto.platform ?? null,
    updatedAt: new Date().toISOString(),
  };
}

export async function registerPushToken(
  dto: RegisterPushTokenDto,
): Promise<RegisteredPushToken> {
  if (useMocksNow()) {
    return buildMockRegisteredPushToken(dto);
  }
  bootstrapApiClient();
  return api.users.registerPushToken(dto);
}

export type { PushPlatform, RegisterPushTokenDto, RegisteredPushToken };
