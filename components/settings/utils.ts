import type { ThemePreset } from './constants';

function normalizeThemeValue(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

export function findMatchingPresetId(
  presets: ThemePreset[],
  primaryColor: string,
  secondaryColor: string,
  backgroundColor: string,
): string | null {
  const normalizedPrimary = normalizeThemeValue(primaryColor);
  const normalizedSecondary = normalizeThemeValue(secondaryColor);
  const normalizedBackground = normalizeThemeValue(backgroundColor);

  const exactMatch = presets.find((preset) =>
    normalizeThemeValue(preset.primary) === normalizedPrimary &&
    normalizeThemeValue(preset.secondary) === normalizedSecondary &&
    normalizeThemeValue(preset.background) === normalizedBackground
  );

  if (exactMatch) {
    return exactMatch.id;
  }

  const primarySecondaryMatch = presets.find((preset) =>
    normalizeThemeValue(preset.primary) === normalizedPrimary &&
    normalizeThemeValue(preset.secondary) === normalizedSecondary
  );

  return primarySecondaryMatch?.id || null;
}
