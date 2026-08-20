import { useCallback, useEffect, useRef, useState } from 'react';
import { isAndroidAppShell, postToAndroidApp } from './androidApp';
import { todayIsoDate } from './edition';
import { clearDispatchToken, saveDispatchToken } from './firebaseStore';

const SUB_KEY = 'cryptogram_delivery_subscribed';
const LAST_KEY = 'cryptogram_delivery_last';
const DISPATCH_BODY =
  "New Dispatch: Solved ciphers won't catch the culprit. Today's case file is ready.";
let openingNoticeSent = false;

function iconUrl() {
  return new URL(`${import.meta.env.BASE_URL}pwa-192x192.png`, window.location.href).href;
}

async function showPaperNotice(title: string, body: string) {
  const options: NotificationOptions = {
    body,
    icon: iconUrl(),
    badge: iconUrl(),
    tag: 'morning-dispatch',
  };
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<ServiceWorkerRegistration | undefined>((resolve) => {
        window.setTimeout(() => resolve(undefined), 1200);
      }),
    ]);
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  }
  new Notification(title, options);
}

function readSubscribed() {
  try {
    return localStorage.getItem(SUB_KEY) === '1';
  } catch {
    return false;
  }
}

type DeliveryDetail = {
  subscribed?: boolean;
  blocked?: boolean;
  token?: string;
};

export function useDailyNotification(uid?: string | null) {
  const androidApp = isAndroidAppShell();
  const notificationApi = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (androidApp) return 'default';
    return notificationApi ? Notification.permission : 'denied';
  });
  const [subscribed, setSubscribed] = useState(() => {
    if (!readSubscribed()) return false;
    if (androidApp) return true;
    return notificationApi && Notification.permission === 'granted';
  });
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const tokenRef = useRef('');
  const uidRef = useRef(uid);
  uidRef.current = uid;

  const persistToken = useCallback(async (nextUid: string | null | undefined, token: string, nextSubscribed: boolean) => {
    if (!nextUid || !token) return;
    if (nextSubscribed) {
      await saveDispatchToken(nextUid, token, true);
      return;
    }
    await clearDispatchToken(nextUid, token);
  }, []);

  useEffect(() => {
    if (!androidApp) return;
    const onNative = (event: Event) => {
      const detail = (event as CustomEvent<DeliveryDetail>).detail;
      if (detail?.blocked) {
        setPermission('denied');
        setSubscribed(false);
        localStorage.removeItem(SUB_KEY);
        persistToken(uidRef.current, tokenRef.current, false).catch(() => undefined);
        return;
      }
      if (typeof detail?.token === 'string' && detail.token) {
        tokenRef.current = detail.token;
      }
      if (detail?.subscribed) {
        setPermission('granted');
        localStorage.setItem(SUB_KEY, '1');
        setSubscribed(true);
        persistToken(uidRef.current, tokenRef.current, true).catch(() => undefined);
        return;
      }
      if (detail?.subscribed === false) {
        if (detail?.blocked === false) setPermission('granted');
        localStorage.removeItem(SUB_KEY);
        setSubscribed(false);
        persistToken(uidRef.current, tokenRef.current, false).catch(() => undefined);
        return;
      }
      if (detail?.blocked === false) setPermission('granted');
    };
    window.addEventListener('chronicle-native-delivery', onNative);
    return () => window.removeEventListener('chronicle-native-delivery', onNative);
  }, [androidApp, persistToken]);

  useEffect(() => {
    if (!uid || !tokenRef.current || !subscribed) return;
    persistToken(uid, tokenRef.current, true).catch(() => undefined);
  }, [persistToken, subscribed, uid]);

  const supported = androidApp || notificationApi;

  useEffect(() => {
    if (!androidApp || !subscribed) return;
    const ping = () => postToAndroidApp({ type: 'DELIVERY_RESCHEDULE' });
    ping();
    const onVis = () => {
      if (document.visibilityState === 'visible') ping();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [androidApp, subscribed]);

  useEffect(() => {
    if (androidApp || !notificationApi) return;
    const sync = () => {
      const next = Notification.permission;
      setPermission(next);
      if (next === 'granted') return;
      if (!readSubscribed()) return;
      localStorage.removeItem(SUB_KEY);
      setSubscribed(false);
    };
    sync();
    const onVis = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', sync);
    let status: PermissionStatus | null = null;
    navigator.permissions
      ?.query({ name: 'notifications' })
      .then((next) => {
        status = next;
        next.onchange = sync;
      })
      .catch(() => undefined);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', sync);
      if (status) status.onchange = null;
    };
  }, [androidApp, notificationApi]);

  useEffect(() => {
    if (androidApp || !supported) return;
    setPermission(Notification.permission);
    if (Notification.permission !== 'granted' || !readSubscribed()) return;
    const today = todayIsoDate();
    try {
      if (openingNoticeSent || localStorage.getItem(LAST_KEY) === today) return;
      openingNoticeSent = true;
    } catch {
      return;
    }
    showPaperNotice('Chronicle Cryptogram', DISPATCH_BODY)
      .then(() => {
        localStorage.setItem(LAST_KEY, today);
      })
      .catch(() => {});
  }, [androidApp, supported]);

  const subscribe = useCallback(async () => {
    if (!supported) {
      setSubscribeError('Notifications are not available on this desk.');
      return;
    }
    setSubscribeError(null);
    if (androidApp) {
      postToAndroidApp({ type: 'DELIVERY_SUBSCRIBE' });
      return;
    }
    const next = await Notification.requestPermission();
    setPermission(next);
    if (next !== 'granted') {
      setSubscribeError('Allow notifications to join the morning dispatch.');
      return;
    }
    localStorage.setItem(SUB_KEY, '1');
    setSubscribed(true);
    const today = todayIsoDate();
    localStorage.setItem(LAST_KEY, today);
    await showPaperNotice(
      'Chronicle Cryptogram',
      'You are on the delivery list. We will ring when a new edition is on the stands.'
    ).catch(() => undefined);
  }, [androidApp, supported]);

  const toggleDelivery = useCallback(async () => {
    if (!supported) return;
    if (subscribed) {
      if (androidApp) {
        postToAndroidApp({ type: 'DELIVERY_UNSUBSCRIBE' });
        return;
      }
      localStorage.removeItem(SUB_KEY);
      setSubscribed(false);
      return;
    }
    await subscribe();
  }, [androidApp, subscribe, subscribed, supported]);

  const openSettings = useCallback(() => {
    postToAndroidApp({ type: 'OPEN_SETTINGS' });
  }, []);

  return {
    supported,
    subscribed: subscribed && (androidApp || permission === 'granted'),
    blocked: permission === 'denied',
    toggleDelivery,
    openSettings,
    subscribeError,
  };
}
