import type { GuestTheme } from '../_hooks/useGuestTheme';

export type GuestThemeSnapshot = GuestTheme;

function getGuestThemeStorageKey(eventKey: string) {
  return `guest_theme_${eventKey}`;
}

export function readGuestThemeSnapshot(eventKey: string | null | undefined): GuestThemeSnapshot | null {
  if (typeof window === 'undefined' || !eventKey) {
    return null;
  }

  try {
    const raw = localStorage.getItem(getGuestThemeStorageKey(eventKey));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<GuestThemeSnapshot>;
    if (
      typeof parsed.themePrimary !== 'string' ||
      typeof parsed.themeSecondary !== 'string' ||
      typeof parsed.themeBackground !== 'string' ||
      typeof parsed.themeSurface !== 'string' ||
      typeof parsed.headerBackground !== 'string' ||
      typeof parsed.surfaceText !== 'string' ||
      typeof parsed.surfaceMuted !== 'string' ||
      typeof parsed.surfaceBorder !== 'string'
    ) {
      return null;
    }

    return parsed as GuestThemeSnapshot;
  } catch {
    return null;
  }
}

export function writeGuestThemeSnapshot(eventKeys: Array<string | null | undefined>, theme: GuestThemeSnapshot) {
  if (typeof window === 'undefined') {
    return;
  }

  const uniqueKeys = Array.from(new Set(eventKeys.filter((key): key is string => typeof key === 'string' && key.length > 0)));
  if (uniqueKeys.length === 0) {
    return;
  }

  const serialized = JSON.stringify(theme);
  for (const key of uniqueKeys) {
    localStorage.setItem(getGuestThemeStorageKey(key), serialized);
  }
}
