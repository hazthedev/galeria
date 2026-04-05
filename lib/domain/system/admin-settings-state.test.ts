import type { ISystemSettings } from '@/lib/types';
import {
  adminSettingsReducer,
  DEFAULT_ADMIN_SETTINGS,
  mergeSystemSettings,
} from './admin-settings-state';

describe('admin settings state helpers', () => {
  it('merges partial settings with defaults without dropping nested values', () => {
    const merged = mergeSystemSettings(DEFAULT_ADMIN_SETTINGS, {
      uploads: {
        max_file_mb: 25,
      },
      events: {
        default_settings: {
          theme: {
            primary_color: '#000000',
          },
        },
      },
    } as Partial<ISystemSettings>);

    expect(merged.uploads.max_file_mb).toBe(25);
    expect(merged.uploads.allowed_types).toEqual(DEFAULT_ADMIN_SETTINGS.uploads.allowed_types);
    expect(merged.events.default_settings.theme.primary_color).toBe('#000000');
    expect(merged.events.default_settings.theme.secondary_color).toBe(
      DEFAULT_ADMIN_SETTINGS.events.default_settings.theme.secondary_color
    );
  });

  it('updates upload settings through reducer actions', () => {
    const nextState = adminSettingsReducer(DEFAULT_ADMIN_SETTINGS, {
      type: 'set-upload-max-file-mb',
      value: 18,
    });

    const toggledState = adminSettingsReducer(nextState, {
      type: 'toggle-upload-type',
      value: 'image/webp',
      checked: false,
    });

    expect(nextState.uploads.max_file_mb).toBe(18);
    expect(toggledState.uploads.allowed_types).not.toContain('image/webp');
    expect(toggledState.events.default_settings.theme.primary_color).toBe(
      DEFAULT_ADMIN_SETTINGS.events.default_settings.theme.primary_color
    );
  });

  it('updates nested event theme and feature values without clobbering siblings', () => {
    const withThemeChange = adminSettingsReducer(DEFAULT_ADMIN_SETTINGS, {
      type: 'set-theme-field',
      field: 'background',
      value: '#101010',
    });

    const withFeatureChange = adminSettingsReducer(withThemeChange, {
      type: 'set-feature-field',
      field: 'attendance_enabled',
      value: true,
    });

    expect(withFeatureChange.events.default_settings.theme.background).toBe('#101010');
    expect(withFeatureChange.events.default_settings.theme.primary_color).toBe(
      DEFAULT_ADMIN_SETTINGS.events.default_settings.theme.primary_color
    );
    expect(withFeatureChange.events.default_settings.features.attendance_enabled).toBe(true);
    expect(withFeatureChange.events.default_settings.features.photo_upload_enabled).toBe(true);
  });
});
