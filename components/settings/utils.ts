import type { ThemePreset } from './constants';

export function findMatchingPresetId(
  presets: ThemePreset[],
  primaryColor: string,
  secondaryColor: string,
  backgroundColor: string,
): string | null {
  const matchingPreset = presets.find((preset) =>
    preset.primary === primaryColor &&
    preset.secondary === secondaryColor &&
    preset.background === backgroundColor
  );

  return matchingPreset?.id || null;
}
