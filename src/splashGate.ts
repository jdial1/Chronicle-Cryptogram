import { STORAGE_KEYS } from './utils/storageKeys';
import { sessionGet, storageGet } from './utils/safeStorage';

export const SPLASH_ENTERED_KEY = STORAGE_KEYS.splashEntered;

export type SplashPreviewMode = 'game' | 'dev' | null;

export function splashPreviewMode(): SplashPreviewMode {
  const path = (location.pathname.replace(/\/+$/, '') || '/').toLowerCase();
  const leaf = path.split('/').pop() || '';
  const preview = new URLSearchParams(location.search).get('preview')?.toLowerCase() || '';
  if (leaf === 'splashdev' || leaf === 'splashdev.html' || preview === 'splashdev' || preview === 'dev') {
    return 'dev';
  }
  if (leaf === 'splash' || leaf === 'splash.html' || preview === 'splash' || preview === 'game') {
    return 'game';
  }
  return null;
}

export function splashEnteredThisSession() {
  if (splashPreviewMode()) return false;
  return sessionGet(SPLASH_ENTERED_KEY) === '1' || storageGet(SPLASH_ENTERED_KEY) === '1';
}

export function splashBlocksDesk() {
  const overlay = document.getElementById('splash');
  if (!overlay || overlay.hidden || overlay.classList.contains('is-gone')) return false;
  return !splashEnteredThisSession();
}
