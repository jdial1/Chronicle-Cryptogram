import { postToAndroidApp } from './androidApp';
import { PAPER_DARK, PAPER_LIGHT } from '../themeTokens';
import { STORAGE_KEYS } from './storageKeys';
import { storageGet, storageSet } from './safeStorage';

export const DESK_THEME_KEY = STORAGE_KEYS.deskTheme;

function savedTheme() {
  const saved = storageGet(DESK_THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return null;
}

export function deskThemeIsDark() {
  return savedTheme() === 'dark';
}

export function applyDeskTheme(dark = deskThemeIsDark()) {
  document.documentElement.classList.toggle('theme-dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', dark ? PAPER_DARK : PAPER_LIGHT);
  });
  postToAndroidApp({ type: 'THEME', dark });
}

export function toggleDeskTheme() {
  const next = !deskThemeIsDark();
  storageSet(DESK_THEME_KEY, next ? 'dark' : 'light');
  applyDeskTheme(next);
  return next;
}

applyDeskTheme();
