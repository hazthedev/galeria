export interface UploadSettingsSummary {
  max_file_mb: number;
  allowed_types: string[];
}

export const DEFAULT_UPLOAD_SETTINGS: UploadSettingsSummary = {
  max_file_mb: 10,
  allowed_types: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
};

const MIME_LABELS: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/heic': 'HEIC',
  'image/heif': 'HEIF',
};

export function normalizeUploadSettings(input?: Partial<UploadSettingsSummary>): UploadSettingsSummary {
  return {
    max_file_mb: input?.max_file_mb || DEFAULT_UPLOAD_SETTINGS.max_file_mb,
    allowed_types:
      input?.allowed_types && input.allowed_types.length > 0
        ? input.allowed_types
        : DEFAULT_UPLOAD_SETTINGS.allowed_types,
  };
}

export function formatAllowedUploadTypes(allowedTypes: string[]): string {
  return allowedTypes
    .map((type) => MIME_LABELS[type] || type.replace('image/', '').toUpperCase())
    .join(', ');
}

export function getUploadAcceptValue(allowedTypes: string[]): string {
  return allowedTypes.length > 0 ? allowedTypes.join(',') : 'image/*';
}

export function formatUploadConstraintLabel(settings: UploadSettingsSummary): string {
  return `${formatAllowedUploadTypes(settings.allowed_types)} - Max ${settings.max_file_mb}MB`;
}

export function isHeicLikeFile(file: Pick<File, 'name' | 'type'>): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

export function validateFileAgainstUploadSettings(
  file: Pick<File, 'name' | 'size' | 'type'>,
  settings: UploadSettingsSummary
): { valid: boolean; error?: string } {
  const normalizedSettings = normalizeUploadSettings(settings);
  const maxSize = normalizedSettings.max_file_mb * 1024 * 1024;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${normalizedSettings.max_file_mb}MB limit`,
    };
  }

  const normalizedType = file.type.toLowerCase();
  const allowedTypes = normalizedSettings.allowed_types.map((type) => type.toLowerCase());
  const heicAllowed = allowedTypes.includes('image/heic') || allowedTypes.includes('image/heif');
  const allowedByType = normalizedType !== '' && allowedTypes.includes(normalizedType);

  if (!allowedByType && !(heicAllowed && isHeicLikeFile(file))) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${formatAllowedUploadTypes(normalizedSettings.allowed_types)}`,
    };
  }

  return { valid: true };
}
