import type { Address, ClientProfile, DeletedClientAccount } from '@carservice/shared-types';
import { api, ApiError } from '@carservice/api-client';
import { env, parseUseMocks } from '../config/env';
import { bootstrapApiClient } from './api-bootstrap';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

const MOCK_PROFILE: ClientProfile = {
  id: 'b1111111-1111-4111-8111-111111111201',
  userId: 'a1111111-1111-4111-8111-111111111101',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '+33601020304',
  email: null,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-16T10:00:00.000Z',
};

let profileState: ClientProfile = { ...MOCK_PROFILE };
let deleted = false;

export function resetMockProfileForTests(): void {
  profileState = { ...MOCK_PROFILE };
  deleted = false;
}

export async function getClientProfile(): Promise<ClientProfile> {
  if (useMocksNow()) {
    if (deleted) {
      throw new ApiError('CLIENT_NOT_FOUND', 'Compte introuvable.', 404);
    }
    return { ...profileState };
  }
  bootstrapApiClient();
  return api.clients.me();
}

export async function updateClientProfile(input: {
  firstName?: string | null;
  lastName?: string | null;
}): Promise<ClientProfile> {
  if (useMocksNow()) {
    if (deleted) {
      throw new ApiError('CLIENT_NOT_FOUND', 'Compte introuvable.', 404);
    }
    profileState = {
      ...profileState,
      firstName: input.firstName !== undefined ? input.firstName : profileState.firstName,
      lastName: input.lastName !== undefined ? input.lastName : profileState.lastName,
      updatedAt: new Date().toISOString(),
    };
    return { ...profileState };
  }
  bootstrapApiClient();
  return api.clients.updateMe(input);
}

export async function deleteClientAccount(): Promise<DeletedClientAccount> {
  if (useMocksNow()) {
    if (deleted) {
      throw new ApiError('ACCOUNT_ALREADY_DELETED', 'Compte déjà supprimé.', 404);
    }
    deleted = true;
    return {
      userId: profileState.userId,
      deleted: true,
      anonymizedAt: new Date().toISOString(),
    };
  }
  bootstrapApiClient();
  return api.clients.deleteMe();
}

export type { Address, ClientProfile };
