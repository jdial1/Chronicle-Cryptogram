import { STORAGE_KEYS } from './utils/storageKeys';
import { sessionGet, storageGet } from './utils/safeStorage';

export const SPLASH_ENTERED_KEY = STORAGE_KEYS.splashEntered;

export function splashEnteredThisSession() {
  return sessionGet(SPLASH_ENTERED_KEY) === '1' || storageGet(SPLASH_ENTERED_KEY) === '1';
}

export function splashBlocksDesk() {
  const overlay = document.getElementById('splash');
  if (!overlay || overlay.hidden || overlay.classList.contains('is-gone')) return false;
  return !splashEnteredThisSession();
}
