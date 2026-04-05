import type { ISystemSettings } from '@/lib/types';

export const DEFAULT_ADMIN_SETTINGS: ISystemSettings = {
  uploads: {
    max_file_mb: 10,
    allowed_types: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
  },
  moderation: undefined,
  events: {
    default_settings: {
      theme: {
        primary_color: '#8B5CF6',
        secondary_color: '#EC4899',
        background: '#F9FAFB',
        logo_url: undefined,
        frame_template: 'polaroid',
        photo_card_style: 'vacation',
      },
      features: {
        photo_upload_enabled: true,
        lucky_draw_enabled: true,
        reactions_enabled: true,
        moderation_required: false,
        anonymous_allowed: true,
        guest_download_enabled: true,
        photo_challenge_enabled: false,
        attendance_enabled: false,
      },
    },
  },
};

export const ALLOWED_UPLOAD_TYPE_OPTIONS = [
  { label: 'JPEG', value: 'image/jpeg' },
  { label: 'PNG', value: 'image/png' },
  { label: 'HEIC', value: 'image/heic' },
  { label: 'WEBP', value: 'image/webp' },
] as const;

export type ThemeField = keyof ISystemSettings['events']['default_settings']['theme'];
export type FeatureField = keyof ISystemSettings['events']['default_settings']['features'];

export type AdminSettingsAction =
  | { type: 'replace'; value: ISystemSettings }
  | { type: 'set-upload-max-file-mb'; value: number }
  | { type: 'toggle-upload-type'; value: string; checked: boolean }
  | { type: 'set-theme-field'; field: ThemeField; value: string }
  | { type: 'set-feature-field'; field: FeatureField; value: boolean };

export function mergeSystemSettings(
  base: ISystemSettings,
  patch?: Partial<ISystemSettings>
): ISystemSettings {
  if (!patch) return base;

  return {
    uploads: {
      ...base.uploads,
      ...(patch.uploads || {}),
      allowed_types: patch.uploads?.allowed_types || base.uploads.allowed_types,
    },
    moderation: patch.moderation ?? base.moderation,
    events: {
      default_settings: {
        theme: {
          ...base.events.default_settings.theme,
          ...(patch.events?.default_settings?.theme || {}),
        },
        features: {
          ...base.events.default_settings.features,
          ...(patch.events?.default_settings?.features || {}),
        },
      },
    },
  };
}

export function adminSettingsReducer(
  state: ISystemSettings,
  action: AdminSettingsAction
): ISystemSettings {
  switch (action.type) {
    case 'replace':
      return action.value;
    case 'set-upload-max-file-mb':
      return {
        ...state,
        uploads: {
          ...state.uploads,
          max_file_mb: action.value,
        },
      };
    case 'toggle-upload-type': {
      const nextAllowedTypes = new Set(state.uploads.allowed_types || []);
      if (action.checked) {
        nextAllowedTypes.add(action.value);
      } else {
        nextAllowedTypes.delete(action.value);
      }

      return {
        ...state,
        uploads: {
          ...state.uploads,
          allowed_types: Array.from(nextAllowedTypes),
        },
      };
    }
    case 'set-theme-field':
      return {
        ...state,
        events: {
          default_settings: {
            ...state.events.default_settings,
            theme: {
              ...state.events.default_settings.theme,
              [action.field]: action.value,
            },
          },
        },
      };
    case 'set-feature-field':
      return {
        ...state,
        events: {
          default_settings: {
            ...state.events.default_settings,
            features: {
              ...state.events.default_settings.features,
              [action.field]: action.value,
            },
          },
        },
      };
    default:
      return state;
  }
}
