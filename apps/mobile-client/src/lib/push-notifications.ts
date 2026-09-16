import type { Href } from 'expo-router';
import type { PushPlatform } from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import { MOCK_EXPO_PUSH_TOKEN, registerPushToken } from '../data/push';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export type DevicePushCredentials = {
  token: string;
  platform: PushPlatform;
  source: 'native' | 'mock';
};

type NotificationsModule = {
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: (options?: {
    projectId?: string;
  }) => Promise<{ data: string }>;
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

type DeviceModule = {
  isDevice: boolean;
};

function loadNotifications(): NotificationsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

function loadDevice(): DeviceModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-device') as DeviceModule;
  } catch {
    return null;
  }
}

function loadProjectId(): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants') as {
      easConfig?: { projectId?: string };
      expoConfig?: { extra?: { eas?: { projectId?: string } } };
    };
    return (
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId
    );
  } catch {
    return undefined;
  }
}

export function currentPushPlatform(): PushPlatform {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require('react-native') as { Platform: { OS: string } };
    return Platform.OS === 'android' ? 'android' : 'ios';
  } catch {
    return 'ios';
  }
}

/** Maps notification payload / deep link → in-app route. */
export function resolvePushDeepLink(
  data: Record<string, unknown> | undefined | null,
): Href | null {
  if (!data) {
    return null;
  }
  const bookingId = data.bookingId;
  if (typeof bookingId === 'string' && bookingId.length > 0) {
    return `/bookings/${bookingId}`;
  }
  const path = data.path;
  if (typeof path === 'string' && path.startsWith('/')) {
    return path as Href;
  }
  return null;
}

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (useMocksNow()) {
    return 'granted';
  }
  const Notifications = loadNotifications();
  if (!Notifications) {
    return 'unavailable';
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') {
    return 'granted';
  }
  if (current.status === 'denied') {
    return 'denied';
  }
  return 'undetermined';
}

export async function obtainDevicePushCredentials(): Promise<DevicePushCredentials | null> {
  if (useMocksNow()) {
    return {
      token: MOCK_EXPO_PUSH_TOKEN,
      platform: currentPushPlatform(),
      source: 'mock',
    };
  }

  const Notifications = loadNotifications();
  const Device = loadDevice();
  if (!Notifications || !Device) {
    return null;
  }
  if (!Device.isDevice) {
    return null;
  }

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (permission.status !== 'granted') {
    return null;
  }

  const projectId = loadProjectId();
  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return {
    token: tokenResult.data,
    platform: currentPushPlatform(),
    source: 'native',
  };
}

/**
 * Request permission (if needed), resolve Expo token, register with API/mock.
 * Safe no-op when unsigned / simulator without native module.
 */
export async function enableAndRegisterPush(): Promise<{
  ok: boolean;
  reason?: string;
  token?: string;
}> {
  const credentials = await obtainDevicePushCredentials();
  if (!credentials) {
    return { ok: false, reason: 'permission_or_device' };
  }
  const registered = await registerPushToken({
    token: credentials.token,
    platform: credentials.platform,
  });
  return { ok: true, token: registered.token };
}

export function configureNotificationHandler(): void {
  if (useMocksNow()) {
    return;
  }
  const Notifications = loadNotifications();
  if (!Notifications) {
    return;
  }
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export function subscribeNotificationResponses(
  onNavigate: (href: Href) => void,
): () => void {
  if (useMocksNow()) {
    return () => undefined;
  }
  const Notifications = loadNotifications();
  if (!Notifications) {
    return () => undefined;
  }

  const handle = (data: Record<string, unknown> | undefined) => {
    const href = resolvePushDeepLink(data);
    if (href) {
      onNavigate(href);
    }
  };

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    handle(response?.notification.request.content.data);
  });

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    handle(response.notification.request.content.data);
  });

  return () => sub.remove();
}
