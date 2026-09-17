import type { Href } from 'expo-router';
import type { PushPlatform } from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import { MOCK_EXPO_PUSH_TOKEN, registerPushToken } from '../data/push';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

type NotificationsModule = {
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: (options?: { projectId?: string }) => Promise<{ data: string }>;
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }) => void;
  addNotificationResponseReceivedListener: (
    listener: (response: {
      notification: { request: { content: { data?: Record<string, unknown> } } };
    }) => void,
  ) => { remove: () => void };
  getLastNotificationResponseAsync: () => Promise<{
    notification: { request: { content: { data?: Record<string, unknown> } } };
  } | null>;
};

function loadNotifications(): NotificationsModule | null {
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

export function currentPushPlatform(): PushPlatform {
  try {
    const { Platform } = require('react-native') as { Platform: { OS: string } };
    return Platform.OS === 'android' ? 'android' : 'ios';
  } catch {
    return 'ios';
  }
}

/** Tap notif → P03. Si déjà P04/P05, rester (OS only). */
export function resolveProviderPushDeepLink(
  data: Record<string, unknown> | undefined | null,
  currentPath = '',
): Href | null {
  if (!data) {
    return null;
  }
  if (currentPath.includes('/active') || currentPath.includes('/execute')) {
    return null;
  }
  const bookingId = data.bookingId;
  if (typeof bookingId === 'string' && bookingId.length > 0) {
    return `/missions/${bookingId}` as Href;
  }
  return null;
}

export async function enableAndRegisterPush(): Promise<{
  ok: boolean;
  token?: string;
}> {
  if (useMocksNow() || !process.env.EXPO_ACCESS_TOKEN) {
    const registered = await registerPushToken({
      token: MOCK_EXPO_PUSH_TOKEN,
      platform: currentPushPlatform(),
    });
    return { ok: true, token: registered.token };
  }
  const Notifications = loadNotifications();
  if (!Notifications) {
    const registered = await registerPushToken({
      token: MOCK_EXPO_PUSH_TOKEN,
      platform: currentPushPlatform(),
    });
    return { ok: true, token: registered.token };
  }
  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (permission.status !== 'granted') {
    return { ok: false };
  }
  const tokenResult = await Notifications.getExpoPushTokenAsync();
  const registered = await registerPushToken({
    token: tokenResult.data,
    platform: currentPushPlatform(),
  });
  return { ok: true, token: registered.token };
}

export function playMissionPing(soundOn: boolean): 'ping' | 'silent' {
  return soundOn ? 'ping' : 'silent';
}
