'use client';

import { useEffect, useReducer, useState, type Dispatch } from 'react';
import { Loader2, RefreshCcw, Save } from 'lucide-react';
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
import {
  AdminActionButton,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  adminInputClassName,
  adminSelectClassName,
} from '@/components/admin/control-plane';

interface SettingsSectionProps {
  settings: ISystemSettings;
  dispatch: Dispatch<AdminSettingsAction>;
}

function UploadSettingsSection({ settings, dispatch }: SettingsSectionProps) {
  return (
    <AdminPanel
      title="Uploads"
      description="Limits and file acceptance rules enforced on direct browser uploads."
    >
      <div className="space-y-6 text-sm">
        <label className="flex flex-col gap-2 text-[var(--admin-text-soft)]">
          <span className="font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Max file size</span>
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
            className={`${adminInputClassName} max-w-48`}
          />
        </label>

        <div>
          <p className="font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Allowed file types</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ALLOWED_UPLOAD_TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[var(--admin-text-soft)]"
              >
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
    </AdminPanel>
  );
}

function DefaultEventThemeSection({ settings, dispatch }: SettingsSectionProps) {
  const theme = settings.events.default_settings.theme;

  return (
    <AdminPanel
      title="Default Event Theme"
      description="The starting creative direction applied when organizers create a new event."
    >
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[var(--admin-text-soft)]">
          <span className="font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Primary color</span>
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl border border-white/10" style={{ backgroundColor: theme.primary_color }} />
            <input
              type="text"
              value={theme.primary_color}
              onChange={(event) =>
                dispatch({ type: 'set-theme-field', field: 'primary_color', value: event.target.value })
              }
              className={adminInputClassName}
            />
          </div>
        </label>

        <label className="flex flex-col gap-2 text-[var(--admin-text-soft)]">
          <span className="font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Secondary color</span>
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl border border-white/10" style={{ backgroundColor: theme.secondary_color }} />
            <input
              type="text"
              value={theme.secondary_color}
              onChange={(event) =>
                dispatch({ type: 'set-theme-field', field: 'secondary_color', value: event.target.value })
              }
              className={adminInputClassName}
            />
          </div>
        </label>

        <label className="flex flex-col gap-2 text-[var(--admin-text-soft)]">
          <span className="font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Background</span>
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl border border-white/10" style={{ backgroundColor: theme.background }} />
            <input
              type="text"
              value={theme.background}
              onChange={(event) =>
                dispatch({ type: 'set-theme-field', field: 'background', value: event.target.value })
              }
              className={adminInputClassName}
            />
          </div>
        </label>

        <label className="flex flex-col gap-2 text-[var(--admin-text-soft)]">
          <span className="font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Frame template</span>
          <select
            value={theme.frame_template}
            onChange={(event) =>
              dispatch({ type: 'set-theme-field', field: 'frame_template', value: event.target.value })
            }
            className={adminSelectClassName}
          >
            <option value="polaroid">Polaroid</option>
            <option value="filmstrip">Filmstrip</option>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-[var(--admin-text-soft)]">
          <span className="font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Photo card style</span>
          <select
            value={theme.photo_card_style || 'vacation'}
            onChange={(event) =>
              dispatch({ type: 'set-theme-field', field: 'photo_card_style', value: event.target.value })
            }
            className={adminSelectClassName}
          >
            <option value="vacation">Vacation</option>
            <option value="brutalist">Brutalist minimal</option>
            <option value="wedding">Wedding</option>
            <option value="celebration">Celebration</option>
            <option value="futuristic">Futuristic</option>
          </select>
        </label>
      </div>
    </AdminPanel>
  );
}

function DefaultEventFeaturesSection({ settings, dispatch }: SettingsSectionProps) {
  return (
    <AdminPanel
      title="Default Event Features"
      description="Feature toggles that shape every new event before organizers touch it."
    >
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        {Object.entries(settings.events.default_settings.features).map(([key, value]) => (
          <label
            key={key}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[var(--admin-text-soft)]"
          >
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
            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
          </label>
        ))}
      </div>
    </AdminPanel>
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
    } catch (fetchError) {
      toast.error(fetchError instanceof Error ? fetchError.message : 'Failed to load settings');
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
    } catch (fetchError) {
      toast.error(fetchError instanceof Error ? fetchError.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <AdminLoadingState label="Loading system settings" />;
  }

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Platform defaults"
        title="System Settings"
        description="Set the guardrails that shape uploads, event defaults, and the visual baseline organizers inherit when they create something new."
        actions={
          <>
            <AdminActionButton onClick={() => void fetchSettings()}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </AdminActionButton>
            <AdminActionButton onClick={() => void saveSettings()} variant="primary" disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save changes'}
            </AdminActionButton>
          </>
        }
      />

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
    </AdminPage>
  );
}
