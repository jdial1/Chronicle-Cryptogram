import { STORAGE_KEYS } from './storageKeys';
import { storageGet, storageSet } from './safeStorage';

export const BUREAU_DESK_SEEN_KEY = STORAGE_KEYS.bureauDeskSeen;
export const CIPHER_KEYBOARD_KEY = STORAGE_KEYS.cipherKeyboard;

export function bureauDeskSeen() {
  return storageGet(BUREAU_DESK_SEEN_KEY) === '1';
}

export function markBureauDeskSeen() {
  storageSet(BUREAU_DESK_SEEN_KEY, '1');
}

export function usesGameKeyboard() {
  return storageGet(CIPHER_KEYBOARD_KEY) !== 'native';
}

export function toggleGameKeyboard() {
  const next = !usesGameKeyboard();
  storageSet(CIPHER_KEYBOARD_KEY, next ? 'game' : 'native');
  return next;
}
