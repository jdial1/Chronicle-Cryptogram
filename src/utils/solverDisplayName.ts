import { STORAGE_KEYS } from './storageKeys';
import { storageGet, storageSet } from './safeStorage';

export const DEFAULT_CODENAME = 'Codebreaker';

export function solverDisplayName(user?: { displayName?: string | null } | null): string {
  return storageGet(STORAGE_KEYS.codename)?.trim() || user?.displayName?.trim() || DEFAULT_CODENAME;
}

export function readStoredCodename(): string {
  return storageGet(STORAGE_KEYS.codename)?.trim() || '';
}

export function writeStoredCodename(codename: string): void {
  const next = codename.trim().slice(0, 24);
  if (!next) return;
  storageSet(STORAGE_KEYS.codename, next);
}
