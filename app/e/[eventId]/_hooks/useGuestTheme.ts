'use client';

import { useMemo } from 'react';
import type { IEvent } from '@/lib/types';
import { hexToRgba, isColorDark } from '../_lib/guest-utils';

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

export function useGuestTheme(event: IEvent | null): GuestTheme {
  return useMemo(() => {
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
  }, [event]);
}
