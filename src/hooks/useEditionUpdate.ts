import { useEffect, useState } from 'react';
import { APP_VERSION } from '../data/appVersion';
import { postToAndroidApp } from '../utils/androidApp';
import { logDesk } from '../utils/deskError';

const POLL_MS = 5 * 60 * 1000;

/**
 * The bundled Android build emits no version.json and updates through Play, so the
 * poll can only ever fail -- on a 1.2s timer, every five minutes, and on every focus
 * and visibility change. Short-circuit the whole hook there.
 */
const IS_BUNDLED = import.meta.env.VITE_BUNDLED === '1';

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
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (IS_BUNDLED) return;
    let timer = 0;
    let cancelled = false;

    const check = () => {
      readPressVersion()
        .then((version) => {
          if (!cancelled && version) setPressVersion(version);
        })
        .catch((err) => logDesk('edition-update', err));
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

  useEffect(() => {
    if (IS_BUNDLED) return; // the preview hotkey would show a banner that cannot be acted on
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.shiftKey) return;
      if (event.key !== 'U' && event.key !== 'u') return;
      event.preventDefault();
      setPreview((open) => !open);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ready = Boolean(pressVersion && pressVersion !== APP_VERSION);
  const previewPress = pressVersion && pressVersion !== APP_VERSION ? pressVersion : '1.0.999';
  return {
    localVersion: APP_VERSION,
    serverVersion: preview ? previewPress : pressVersion,
    updateReady: ready || preview,
  };
}
