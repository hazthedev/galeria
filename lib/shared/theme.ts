// ============================================
// Shared theme helpers
// ============================================

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'galeria-theme';
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia(THEME_MEDIA_QUERY).matches ? 'dark' : 'light';
}
