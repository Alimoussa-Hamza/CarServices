import { useEffect, useRef } from 'react';
import { router, type Href } from 'expo-router';
import {
  configureNotificationHandler,
  enableAndRegisterPush,
  subscribeNotificationResponses,
} from '../lib/push-notifications';
import { useAuthStore } from '../stores/auth.store';

/**
 * Registers Expo push token when the user is authenticated.
 * Also wires notification tap → booking deep link.
 */
export function usePushRegistration(): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    return subscribeNotificationResponses((href: Href) => {
      router.push(href);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !accessToken) {
      registeredFor.current = null;
      return;
    }
    if (registeredFor.current === accessToken) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const result = await enableAndRegisterPush();
      if (!cancelled && result.ok) {
        registeredFor.current = accessToken;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, hydrated]);
}
