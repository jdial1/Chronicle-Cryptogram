import { postToAndroidApp } from './androidApp';

export const DESK_THEME_KEY = 'cryptogram_desk_theme';

function savedTheme() {
  try {
    const saved = localStorage.getItem(DESK_THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    return null;
  }
  return null;
}

export function deskThemeIsDark() {
  return savedTheme() === 'dark';
}

export function applyDeskTheme(dark = deskThemeIsDark()) {
  document.documentElement.classList.toggle('theme-dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', dark ? '#1C1A17' : '#fbf7ee');
  });
  postToAndroidApp({ type: 'THEME', dark });
}

export function toggleDeskTheme() {
  const next = !deskThemeIsDark();
  try {
    localStorage.setItem(DESK_THEME_KEY, next ? 'dark' : 'light');
  } catch {
    /* persist when available */
  }
  applyDeskTheme(next);
  return next;
}

applyDeskTheme();

