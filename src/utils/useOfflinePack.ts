import { useEffect, useState } from 'react';
import { APP_VERSION } from '../data/appVersion';
import { plateSrcs } from '../data/plates';
import { postToAndroidApp } from './androidApp';

const PRESS_PACK_KEY = 'cryptogram_offline_pack';
const PRESS_PACK_CACHE = 'chronicle-press-pack';

type PressPackRecord = {
  version: string;
  packedAt: number;
};

type PressPackStatus = 'unsupported' | 'empty' | 'packing' | 'packed' | 'stale';

const FONT_FILES = [
  'fonts.css',
  'fonts/cinzel-700.woff2',
  'fonts/cinzel-900.woff2',
  'fonts/playfair-display-700.woff2',
  'fonts/playfair-display-900.woff2',
  'fonts/newsreader-400.woff2',
  'fonts/newsreader-400-italic.woff2',
  'fonts/newsreader-700.woff2',
  'fonts/im-fell-english-400.woff2',
  'fonts/special-elite-400.woff2',
  'fonts/unifrakturmaguntia-400.woff2',
  'fonts/beth-ellen-400.woff2',
];

const ICON_FILES = [
  'apple-touch-icon.png',
  'favicon-32x32.png',
  'mask-icon.svg',
  'pwa-192x192.png',
  'pwa-512x512.png',
  'pwa-512x512-maskable.png',
];

export function useDeskOnline() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return online;
}

function readRecord(): PressPackRecord | null {
  try {
    const raw = localStorage.getItem(PRESS_PACK_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PressPackRecord;
    if (typeof data?.version !== 'string' || !data.version) return null;
    const packedAt = Number(data.packedAt);
    if (!Number.isFinite(packedAt) || packedAt <= 0) return null;
    return { version: data.version, packedAt };
  } catch {
    return null;
  }
}

function writeRecord(record: PressPackRecord) {
  localStorage.setItem(PRESS_PACK_KEY, JSON.stringify(record));
}

function pressPackStatus(
  record: PressPackRecord | null,
  serverVersion: string | null,
  packing: boolean
): PressPackStatus {
  if (packing) return 'packing';
  if (typeof window === 'undefined' || !('caches' in window)) return 'unsupported';
  if (!record) return 'empty';
  if (record.version !== APP_VERSION) return 'stale';
  if (serverVersion && serverVersion !== record.version) return 'stale';
  return 'packed';
}

function sameOrigin(url: string) {
  try {
    return new URL(url, location.href).origin === location.origin;
  } catch {
    return false;
  }
}

function isVersionJson(url: string) {
  try {
    return /\/version\.json$/i.test(new URL(url, location.href).pathname);
  } catch {
    return /version\.json/i.test(url);
  }
}

function assetUrl(path: string) {
  return new URL(path, window.location.href).href;
}

async function waitForWorker() {
  if (!('serviceWorker' in navigator)) return;
  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) return;
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller) return;
  await new Promise<void>((resolve) => {
    const finish = () => resolve();
    const fail = window.setTimeout(finish, 10000);
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.clearTimeout(fail);
        finish();
      },
      { once: true }
    );
  });
}

function collectDocumentUrls() {
  const urls = new Set<string>();
  urls.add(new URL('./', location.href).href);
  urls.add(location.href.replace(/[?#].*$/, ''));
  document.querySelectorAll('link[href], script[src], img[src]').forEach((node) => {
    const value = node.getAttribute('href') || node.getAttribute('src');
    if (!value) return;
    const abs = new URL(value, location.href).href;
    if (sameOrigin(abs) && !isVersionJson(abs)) urls.add(abs);
  });
  for (const entry of performance.getEntriesByType('resource')) {
    if (sameOrigin(entry.name) && !isVersionJson(entry.name)) urls.add(entry.name);
  }
  try {
    for (const sheet of document.styleSheets) {
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (const rule of rules) {
        if (!(rule instanceof CSSFontFaceRule)) continue;
        const src = rule.style.getPropertyValue('src');
        for (const match of src.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
          const abs = new URL(match[1], sheet.href || location.href).href;
          if (sameOrigin(abs) && !isVersionJson(abs)) urls.add(abs);
        }
      }
    }
  } catch {
    return urls;
  }
  return urls;
}

async function collectCacheUrls() {
  const urls = new Set<string>();
  if (!('caches' in window)) return urls;
  const names = await caches.keys();
  for (const name of names) {
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      if (sameOrigin(request.url) && !isVersionJson(request.url)) urls.add(request.url);
    }
  }
  return urls;
}

async function collectPressPackUrls() {
  const urls = collectDocumentUrls();
  const plates = plateSrcs();
  for (const src of [...plates.people, ...plates.places]) {
    if (sameOrigin(src)) urls.add(src);
  }
  for (const file of [...FONT_FILES, ...ICON_FILES]) {
    urls.add(assetUrl(file));
  }
  try {
    await import('canvas-confetti');
  } catch {
  }
  for (const src of await collectCacheUrls()) urls.add(src);
  return [...urls].filter((url) => !isVersionJson(url));
}

async function cachePack(urls: string[]) {
  const cache = await caches.open(PRESS_PACK_CACHE);
  const unique = [...new Set(urls)];
  try {
    await cache.addAll(unique);
    return;
  } catch {
    const results = await Promise.allSettled(unique.map((url) => cache.add(url)));
    if (results.every((result) => result.status === 'rejected')) {
      throw new Error('pack');
    }
  }
}

async function persistStorage() {
  try {
    await navigator.storage?.persist?.();
  } catch {
  }
}

export async function readPackBytes() {
  try {
    const estimate = await navigator.storage?.estimate?.();
    return typeof estimate?.usage === 'number' ? estimate.usage : null;
  } catch {
    return null;
  }
}

export function formatPackBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatPackedAt(packedAt: number) {
  return new Date(packedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function downloadPressPack() {
  await waitForWorker();
  await persistStorage();
  const urls = await collectPressPackUrls();
  await cachePack(urls);
  const record = { version: APP_VERSION, packedAt: Date.now() };
  writeRecord(record);
  postToAndroidApp({ type: 'PRESS_PACKED', version: APP_VERSION });
  return record;
}

export function useOfflinePack(serverVersion: string | null) {
  const [record, setRecord] = useState(readRecord);
  const [packing, setPacking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bytes, setBytes] = useState<number | null>(null);
  const online = useDeskOnline();
  const status = pressPackStatus(record, online ? serverVersion : null, packing);

  useEffect(() => {
    if (status !== 'packed' && status !== 'stale') return;
    readPackBytes().then(setBytes);
  }, [status, record?.packedAt]);

  const download = async () => {
    setPacking(true);
    setError(null);
    try {
      const next = await downloadPressPack();
      setRecord(next);
      setBytes(await readPackBytes());
    } catch {
      setError('Could not bind the copy. Stay on the wire and try again.');
    } finally {
      setPacking(false);
    }
  };

  return { status, record, bytes, error, online, download };
}
