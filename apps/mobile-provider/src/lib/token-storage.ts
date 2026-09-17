import * as SecureStore from 'expo-secure-store';

export type KeyValueStore = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
};

const memory = new Map<string, string>();

export const memoryTokenStore: KeyValueStore = {
  getItem: async (key) => memory.get(key) ?? null,
  setItem: async (key, value) => {
    memory.set(key, value);
  },
  deleteItem: async (key) => {
    memory.delete(key);
  },
};

export const secureTokenStore: KeyValueStore = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  deleteItem: (key) => SecureStore.deleteItemAsync(key),
};

let activeStore: KeyValueStore = memoryTokenStore;

export function useSecureTokenStore(): void {
  activeStore = secureTokenStore;
}

export function setTokenStore(store: KeyValueStore): void {
  activeStore = store;
}

export function resetMemoryTokenStore(): void {
  memory.clear();
  activeStore = memoryTokenStore;
}

export const TOKEN_KEYS = {
  access: 'cw_pro_access_token',
  refresh: 'cw_pro_refresh_token',
  user: 'cw_pro_auth_user',
} as const;

export async function readToken(key: string): Promise<string | null> {
  return activeStore.getItem(key);
}

export async function writeToken(key: string, value: string): Promise<void> {
  await activeStore.setItem(key, value);
}

export async function clearToken(key: string): Promise<void> {
  await activeStore.deleteItem(key);
}
