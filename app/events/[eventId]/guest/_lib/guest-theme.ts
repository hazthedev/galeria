import type { IEvent, IEventTheme } from '@/lib/types';

export interface GuestTheme {
  photoCardStyle: string;
  themePrimary: string;
  themeSecondary: string;
  themeBackground: string;
  themeSurface: string;
  themeGradient: string;
  surfaceText: string;
  surfaceMuted: string;
  surfaceBorder: string;
  inputBackground: string;
  inputBorder: string;
  headerBackground: string;
  primaryText: string;
  secondaryText: string;
}

type GuestThemeSource =
  | Pick<IEvent, 'settings'>
  | {
      settings?: {
        theme?: Partial<IEventTheme>;
      };
    }
  | null;

export function hexToRgb(hex: string) {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

export function isColorDark(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance < 0.5;
}

export function hexToRgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function buildGuestTheme(event: GuestThemeSource): GuestTheme {
  const photoCardStyle = event?.settings?.theme?.photo_card_style || 'vacation';
  const themePrimary = event?.settings?.theme?.primary_color || '#8B5CF6';
  const themeSecondary = event?.settings?.theme?.secondary_color || '#EC4899';
  const themeBackground = event?.settings?.theme?.background || '#F9FAFB';
  const isGradientBackground = themeBackground.includes('gradient');
  const themeSurface = isGradientBackground ? '#FFFFFF' : themeBackground;
  const themeGradient = themePrimary;
  const surfaceIsDark = isColorDark(themeSurface);
  const surfaceText = surfaceIsDark ? '#F8FAFC' : '#0F172A';
  const surfaceMuted = surfaceIsDark ? '#CBD5F5' : '#475569';
  const surfaceBorder = surfaceIsDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)';
  const inputBackground = surfaceIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.04)';
  const inputBorder = themePrimary;
  const headerBackground = hexToRgba(themeSurface, 0.88);
  const primaryText = isColorDark(themePrimary) ? '#F8FAFC' : '#0F172A';
  const secondaryText = isColorDark(themeSecondary) ? '#F8FAFC' : '#0F172A';

  return {
    photoCardStyle,
    themePrimary,
    themeSecondary,
    themeBackground,
    themeSurface,
    themeGradient,
    surfaceText,
    surfaceMuted,
    surfaceBorder,
    inputBackground,
    inputBorder,
    headerBackground,
    primaryText,
    secondaryText,
  };
}

export function getGuestThemeStyleVars(theme: GuestTheme): Record<string, string> {
  return {
    '--guest-theme-primary': theme.themePrimary,
    '--guest-theme-secondary': theme.themeSecondary,
    '--guest-theme-background': theme.themeBackground,
    '--guest-theme-surface': theme.themeSurface,
    '--guest-theme-surface-text': theme.surfaceText,
    '--guest-theme-surface-muted': theme.surfaceMuted,
    '--guest-theme-surface-border': theme.surfaceBorder,
    '--guest-skeleton-page-bg': `radial-gradient(circle at top, ${hexToRgba(theme.themeSecondary, 0.22)}, transparent 35%), ${theme.themeBackground}`,
    '--guest-skeleton-header-bg': theme.headerBackground,
    '--guest-skeleton-border': theme.surfaceBorder,
    '--guest-skeleton-primary': hexToRgba(theme.themePrimary, 0.18),
    '--guest-skeleton-secondary': hexToRgba(theme.themeSecondary, 0.18),
    '--guest-skeleton-neutral': hexToRgba(theme.surfaceText, 0.08),
    '--guest-skeleton-soft-surface': hexToRgba(theme.themePrimary, 0.06),
    '--guest-skeleton-shadow': hexToRgba(theme.themePrimary, 0.12),
    '--guest-skeleton-surface-bg': hexToRgba(theme.themeSurface, 0.92),
    '--guest-skeleton-hero-bg': `linear-gradient(135deg, ${hexToRgba(theme.themePrimary, 0.18)} 0%, ${hexToRgba(theme.themeSecondary, 0.14)} 48%, ${hexToRgba(theme.themeSurface, 0.96)} 100%)`,
    '--guest-skeleton-surface-72': hexToRgba(theme.themeSurface, 0.72),
    '--guest-skeleton-surface-60': hexToRgba(theme.themeSurface, 0.6),
    '--guest-skeleton-surface-58': hexToRgba(theme.themeSurface, 0.58),
    '--guest-skeleton-surface-52': hexToRgba(theme.themeSurface, 0.52),
    '--guest-skeleton-surface-50': hexToRgba(theme.themeSurface, 0.5),
    '--guest-skeleton-surface-45': hexToRgba(theme.themeSurface, 0.45),
  };
}
