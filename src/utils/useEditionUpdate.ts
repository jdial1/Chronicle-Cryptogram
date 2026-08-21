import { useEffect, useState } from 'react';
import { APP_VERSION } from '../data/appVersion';
import { postToAndroidApp } from './androidApp';

const POLL_MS = 5 * 60 * 1000;

function pressVersionUrl() {
  const url = new URL('version.json', window.location.href);
  url.searchParams.set('t', String(Date.now()));
  return url;
}

async function readPressVersion() {
  const res = await fetch(pressVersionUrl(), { cache: 'no-store' });
  if (!res.ok) return null;
  const data: unknown = await res.json();
  if (!data || typeof data !== 'object' || !('version' in data)) return null;
  const version = String((data as { version: unknown }).version).trim();
  return version || null;
}

export async function reloadEdition() {
  postToAndroidApp({ type: 'RELOAD' });
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister()));
  } catch {
    /* best effort */
  }
  window.location.reload();
}

export function useEditionUpdate() {
  const [pressVersion, setPressVersion] = useState<string | null>(null);

  useEffect(() => {
    let timer = 0;
    let cancelled = false;

    const check = () => {
      readPressVersion()
        .then((version) => {
          if (!cancelled && version) setPressVersion(version);
        })
        .catch(() => undefined);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    timer = window.setTimeout(check, 1200);
    const loop = window.setInterval(check, POLL_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearInterval(loop);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, []);

  const ready = Boolean(pressVersion && pressVersion !== APP_VERSION);
  return {
    localVersion: APP_VERSION,
    serverVersion: pressVersion,
    updateReady: ready,
  };
}
