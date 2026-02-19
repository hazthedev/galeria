import { useEffect } from 'react';
import type { ThemePreset } from '../constants';
import { findMatchingPresetId } from '../utils';

interface ThemePresetSyncOptions {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  presets: ThemePreset[];
  onPresetChange: (presetId: string | null) => void;
}

export function useThemePresetSync({
  primaryColor,
  secondaryColor,
  backgroundColor,
  presets,
  onPresetChange,
}: ThemePresetSyncOptions) {
  useEffect(() => {
    const presetId = findMatchingPresetId(presets, primaryColor, secondaryColor, backgroundColor);
    onPresetChange(presetId);
  }, [primaryColor, secondaryColor, backgroundColor, presets, onPresetChange]);
}
