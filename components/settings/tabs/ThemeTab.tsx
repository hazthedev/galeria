import type { Dispatch, SetStateAction } from 'react';
import clsx from 'clsx';
import { Check, Loader2 } from 'lucide-react';
import { PHOTO_CARD_STYLES, PHOTO_CARD_STYLE_CLASSES, THEME_PRESETS } from '../constants';

interface ThemeTabProps {
  photoCardStyle: string;
  setPhotoCardStyle: Dispatch<SetStateAction<string>>;
  primaryColor: string;
  setPrimaryColor: Dispatch<SetStateAction<string>>;
  secondaryColor: string;
  setSecondaryColor: Dispatch<SetStateAction<string>>;
  backgroundColor: string;
  setBackgroundColor: Dispatch<SetStateAction<string>>;
  selectedPreset: string | null;
  setSelectedPreset: Dispatch<SetStateAction<string | null>>;
  isLoading: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onDirty: () => void;
}

export function ThemeTab({
  photoCardStyle,
  setPhotoCardStyle,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  backgroundColor,
  setBackgroundColor,
  selectedPreset,
  setSelectedPreset,
  isLoading,
  hasChanges,
  onSave,
  onDirty,
}: ThemeTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Theme & Design
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Customize the appearance of your event page
          </p>
        </div>
        {hasChanges && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Unsaved changes
          </span>
        )}
      </div>

      <div>
        <h4 className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">
          Photo Card Style
        </h4>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {PHOTO_CARD_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => { setPhotoCardStyle(style.id); onDirty(); }}
              className={clsx(
                'group relative overflow-hidden rounded-lg border-2 p-3 text-left transition-all',
                photoCardStyle === style.id
                  ? 'border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              )}
            >
              <div className={clsx('aspect-[3/4] mb-2', PHOTO_CARD_STYLE_CLASSES[style.id])} />
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{style.label}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{style.description}</p>
              {photoCardStyle === style.id && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-white">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">
          Color Palette
        </h4>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setPrimaryColor(preset.primary);
                setSecondaryColor(preset.secondary);
                setBackgroundColor(preset.background);
                setSelectedPreset(preset.id);
                onDirty();
              }}
              className={clsx(
                'group relative overflow-hidden rounded-lg border-2 p-3 text-left transition-all',
                selectedPreset === preset.id
                  ? 'border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              )}
            >
              <div
                className="h-16 rounded-md mb-2"
                style={{ background: preset.background }}
              />
              <div className="flex items-center gap-1 mb-1">
                <div
                  className="h-4 w-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: preset.primary }}
                />
                <div
                  className="h-4 w-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: preset.secondary }}
                />
              </div>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{preset.label}</p>
              {selectedPreset === preset.id && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-white">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={isLoading || !hasChanges}
          className={clsx(
            'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isLoading || !hasChanges ? 'bg-gray-400' : 'bg-violet-600 hover:bg-violet-700'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
