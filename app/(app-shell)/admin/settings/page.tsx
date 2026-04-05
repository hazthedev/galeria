// ============================================
// Galeria - Supervisor Settings
// ============================================

'use client';

import { useEffect, useReducer, useState, type Dispatch } from 'react';
import { Save, RefreshCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary';
import {
  adminSettingsReducer,
  ALLOWED_UPLOAD_TYPE_OPTIONS,
  DEFAULT_ADMIN_SETTINGS,
  mergeSystemSettings,
  type AdminSettingsAction,
} from '@/lib/domain/system/admin-settings-state';
import type { ISystemSettings } from '@/lib/types';

interface SettingsSectionProps {
  settings: ISystemSettings;
  dispatch: Dispatch<AdminSettingsAction>;
}

function UploadSettingsSection({ settings, dispatch }: SettingsSectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Uploads</h2>
      <p className="mt-1 text-sm text-gray-500">Limits enforced on direct browser uploads.</p>
      <div className="mt-4 space-y-4 text-sm">
        <label className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
          <span>Max file size (MB)</span>
          <input
            type="number"
            min={1}
            value={settings.uploads.max_file_mb}
            onChange={(event) => {
              const nextValue = Number.parseInt(event.target.value || '0', 10);
              dispatch({
                type: 'set-upload-max-file-mb',
                value: Number.isNaN(nextValue) ? 0 : nextValue,
              });
            }}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 sm:w-40"
          />
        </label>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Allowed file types</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {ALLOWED_UPLOAD_TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={settings.uploads.allowed_types.includes(option.value)}
                  onChange={(event) =>
                    dispatch({
                      type: 'toggle-upload-type',
                      value: option.value,
                      checked: event.target.checked,
                    })
                  }
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DefaultEventThemeSection({ settings, dispatch }: SettingsSectionProps) {
  const theme = settings.events.default_settings.theme;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Default Event Theme</h2>
      <p className="mt-1 text-sm text-gray-500">Applied when organizers create new events.</p>
      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
          <span>Primary color</span>
          <input
            type="text"
            value={theme.primary_color}
            onChange={(event) =>
              dispatch({
                type: 'set-theme-field',
                field: 'primary_color',
                value: event.target.value,
              })
            }
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
          />
        </label>
        <label className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
          <span>Secondary color</span>
          <input
            type="text"
            value={theme.secondary_color}
            onChange={(event) =>
              dispatch({
                type: 'set-theme-field',
                field: 'secondary_color',
                value: event.target.value,
              })
            }
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
          />
        </label>
        <label className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
          <span>Background</span>
          <input
            type="text"
            value={theme.background}
            onChange={(event) =>
              dispatch({
                type: 'set-theme-field',
                field: 'background',
                value: event.target.value,
              })
            }
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
          />
        </label>
        <label className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
          <span>Frame template</span>
          <select
            value={theme.frame_template}
            onChange={(event) =>
              dispatch({
                type: 'set-theme-field',
                field: 'frame_template',
                value: event.target.value,
              })
            }
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="polaroid">Polaroid</option>
            <option value="filmstrip">Filmstrip</option>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
          <span>Photo card style</span>
          <select
            value={theme.photo_card_style || 'vacation'}
            onChange={(event) =>
              dispatch({
                type: 'set-theme-field',
                field: 'photo_card_style',
                value: event.target.value,
              })
            }
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="vacation">Vacation</option>
            <option value="brutalist">Brutalist minimal</option>
            <option value="wedding">Wedding</option>
            <option value="celebration">Celebration</option>
            <option value="futuristic">Futuristic</option>
          </select>
        </label>
      </div>
    </section>
  );
}

function DefaultEventFeaturesSection({ settings, dispatch }: SettingsSectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Default Event Features</h2>
      <p className="mt-1 text-sm text-gray-500">Feature toggles applied to newly created events.</p>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {Object.entries(settings.events.default_settings.features).map(([key, value]) => (
          <label key={key} className="flex items-center gap-2 text-xs capitalize text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={value}
              onChange={(event) =>
                dispatch({
                  type: 'set-feature-field',
                  field: key as keyof ISystemSettings['events']['default_settings']['features'],
                  value: event.target.checked,
                })
              }
            />
            {key.replace(/_/g, ' ')}
          </label>
        ))}
      </div>
    </section>
  );
}

export default function SupervisorSettingsPage() {
  const [settings, dispatch] = useReducer(adminSettingsReducer, DEFAULT_ADMIN_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings', { credentials: 'include' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load settings');
      }

      dispatch({
        type: 'replace',
        value: mergeSystemSettings(DEFAULT_ADMIN_SETTINGS, data.data),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success('System settings updated');
      dispatch({
        type: 'replace',
        value: mergeSystemSettings(DEFAULT_ADMIN_SETTINGS, data.data),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure system-wide settings and defaults</p>
        </div>
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure system-wide settings and defaults
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={fetchSettings}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 sm:w-auto"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={saveSettings}
            disabled={isSaving}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionErrorBoundary
          title="Upload settings unavailable"
          message="The upload settings form crashed. You can retry just this section."
        >
          <UploadSettingsSection settings={settings} dispatch={dispatch} />
        </SectionErrorBoundary>

        <SectionErrorBoundary
          title="Theme settings unavailable"
          message="The default event theme form crashed. You can retry just this section."
        >
          <DefaultEventThemeSection settings={settings} dispatch={dispatch} />
        </SectionErrorBoundary>

        <SectionErrorBoundary
          title="Feature settings unavailable"
          message="The default event features form crashed. You can retry just this section."
          className="lg:col-span-2"
        >
          <DefaultEventFeaturesSection settings={settings} dispatch={dispatch} />
        </SectionErrorBoundary>
      </div>
    </div>
  );
}
