import { useCallback, useEffect, useState } from 'react';
import { isAndroidAppShell, postToAndroidApp } from './androidApp';
import { todayIsoDate } from './edition';

const SUB_KEY = 'cryptogram_delivery_subscribed';
const LAST_KEY = 'cryptogram_delivery_last';
let openingNoticeSent = false;

function iconUrl() {
  return new URL(`${import.meta.env.BASE_URL}pwa-192x192.png`, window.location.href).href;
}

async function showPaperNotice(title: string, body: string) {
  const options: NotificationOptions = {
    body,
    icon: iconUrl(),
    badge: iconUrl(),
    tag: 'chronicle-delivery',
  };
  if ('serviceWorker' in navigator) {
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

export function useDailyNotification() {
  const androidApp = isAndroidAppShell();
  const notificationApi = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    notificationApi ? Notification.permission : 'denied'
  );
  const [subscribed, setSubscribed] = useState(readSubscribed);
  const [pwaReady, setPwaReady] = useState(false);

  useEffect(() => {
    if (androidApp || !('serviceWorker' in navigator)) return;
    let cancelled = false;
    const markReady = () => {
      if (!cancelled && navigator.serviceWorker.controller) setPwaReady(true);
    };
    markReady();
    navigator.serviceWorker.ready
      .then((reg) => {
        if (!cancelled && reg.active) setPwaReady(true);
      })
      .catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', markReady);
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', markReady);
    };
  }, [androidApp]);

  useEffect(() => {
    if (!androidApp) return;
    const onNative = (event: Event) => {
      const detail = (event as CustomEvent<{ subscribed?: boolean; blocked?: boolean }>).detail;
      if (detail?.blocked) {
        setPermission('denied');
        setSubscribed(false);
        localStorage.removeItem(SUB_KEY);
        return;
      }
      if (detail?.subscribed) {
        setPermission('granted');
        localStorage.setItem(SUB_KEY, '1');
        setSubscribed(true);
        return;
      }
      localStorage.removeItem(SUB_KEY);
      setSubscribed(false);
    };
    window.addEventListener('chronicle-native-delivery', onNative);
    return () => window.removeEventListener('chronicle-native-delivery', onNative);
  }, [androidApp]);

  const supported = androidApp || (notificationApi && pwaReady);

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
    showPaperNotice(
      'Chronicle Cryptogram',
      "The new paper has arrived! Uncover today's mystery."
    )
      .then(() => {
        localStorage.setItem(LAST_KEY, today);
      })
      .catch(() => {});
  }, [androidApp, supported]);

  const toggleDelivery = useCallback(async () => {
    if (!supported) return;
    if (androidApp) {
      if (subscribed) {
        postToAndroidApp({ type: 'DELIVERY_UNSUBSCRIBE' });
        return;
      }
      postToAndroidApp({ type: 'DELIVERY_SUBSCRIBE' });
      return;
    }
    if (subscribed) {
      localStorage.removeItem(SUB_KEY);
      setSubscribed(false);
      return;
    }
    const next = await Notification.requestPermission();
    setPermission(next);
    if (next !== 'granted') return;
    localStorage.setItem(SUB_KEY, '1');
    setSubscribed(true);
    const today = todayIsoDate();
    localStorage.setItem(LAST_KEY, today);
    await showPaperNotice(
      'Chronicle Cryptogram',
      'You are on the delivery list. We will ring when a new edition is on the stands.'
    ).catch(() => {});
  }, [androidApp, subscribed, supported]);

  return {
    supported,
    subscribed,
    blocked: permission === 'denied',
    toggleDelivery,
  };
}
