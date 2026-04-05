import {
  DEFAULT_UPLOAD_SETTINGS,
  formatAllowedUploadTypes,
  formatUploadConstraintLabel,
  getUploadAcceptValue,
  isHeicLikeFile,
  normalizeUploadSettings,
  validateFileAgainstUploadSettings,
} from './upload-settings';

describe('upload settings helpers', () => {
  it('falls back to repository defaults when settings are missing', () => {
    expect(normalizeUploadSettings()).toEqual(DEFAULT_UPLOAD_SETTINGS);
    expect(normalizeUploadSettings({ allowed_types: [] })).toEqual(DEFAULT_UPLOAD_SETTINGS);
  });

  it('formats labels and accept values from configured mime types', () => {
    expect(formatAllowedUploadTypes(['image/jpeg', 'image/png', 'image/heic'])).toBe('JPEG, PNG, HEIC');
    expect(getUploadAcceptValue(['image/jpeg', 'image/webp'])).toBe('image/jpeg,image/webp');
    expect(formatUploadConstraintLabel({ max_file_mb: 12, allowed_types: ['image/jpeg', 'image/png'] })).toBe(
      'JPEG, PNG - Max 12MB'
    );
  });

  it('detects HEIC/HEIF files by mime type or extension', () => {
    expect(isHeicLikeFile({ name: 'photo.heic', type: '' })).toBe(true);
    expect(isHeicLikeFile({ name: 'photo.jpg', type: 'image/heif' })).toBe(true);
    expect(isHeicLikeFile({ name: 'photo.jpg', type: 'image/jpeg' })).toBe(false);
  });

  it('validates file size and allowed file types against the configured settings', () => {
    const settings = {
      max_file_mb: 5,
      allowed_types: ['image/png', 'image/heic'],
    };

    expect(
      validateFileAgainstUploadSettings(
        { name: 'small.png', size: 1024, type: 'image/png' },
        settings
      )
    ).toEqual({ valid: true });

    expect(
      validateFileAgainstUploadSettings(
        { name: 'big.png', size: 6 * 1024 * 1024, type: 'image/png' },
        settings
      )
    ).toEqual({ valid: false, error: 'File size exceeds 5MB limit' });

    expect(
      validateFileAgainstUploadSettings(
        { name: 'camera.heic', size: 2048, type: '' },
        settings
      )
    ).toEqual({ valid: true });

    expect(
      validateFileAgainstUploadSettings(
        { name: 'photo.jpeg', size: 1024, type: 'image/jpeg' },
        settings
      )
    ).toEqual({ valid: false, error: 'Invalid file type. Allowed: PNG, HEIC' });
  });
});
