import type { ComponentType, Dispatch, SetStateAction } from 'react';
import clsx from 'clsx';
import { Check, Download, Eye, Hash, Loader2, Sparkles, Target, Users } from 'lucide-react';

interface FeaturesTabProps {
  guestDownloadEnabled: boolean;
  setGuestDownloadEnabled: Dispatch<SetStateAction<boolean>>;
  moderationRequired: boolean;
  setModerationRequired: Dispatch<SetStateAction<boolean>>;
  anonymousAllowed: boolean;
  setAnonymousAllowed: Dispatch<SetStateAction<boolean>>;
  luckyDrawEnabled: boolean;
  setLuckyDrawEnabled: Dispatch<SetStateAction<boolean>>;
  attendanceEnabled: boolean;
  setAttendanceEnabled: Dispatch<SetStateAction<boolean>>;
  photoChallengeEnabled: boolean;
  setPhotoChallengeEnabled: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onDirty: () => void;
}

interface FeatureToggleCardProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (nextValue: boolean) => void;
  icon: ComponentType<{ className?: string }>;
}

function FeatureToggleCard({
  title,
  description,
  enabled,
  onToggle,
  icon: Icon,
}: FeatureToggleCardProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onToggle(!enabled)}
      className={clsx(
        'w-full rounded-lg border bg-white p-4 text-left transition-colors',
        'dark:bg-gray-800',
        enabled
          ? 'border-violet-400 dark:border-violet-500'
          : 'border-gray-200 hover:border-violet-300 dark:border-gray-600 dark:hover:border-violet-500'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <span
          className={clsx(
            'relative h-6 w-11 rounded-full transition-colors',
            enabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
          )}
          aria-hidden="true"
        >
          <span
            className={clsx(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all',
              enabled ? 'left-[22px]' : 'left-0.5'
            )}
          />
        </span>
      </div>
    </button>
  );
}

export function FeaturesTab({
  guestDownloadEnabled,
  setGuestDownloadEnabled,
  moderationRequired,
  setModerationRequired,
  anonymousAllowed,
  setAnonymousAllowed,
  luckyDrawEnabled,
  setLuckyDrawEnabled,
  attendanceEnabled,
  setAttendanceEnabled,
  photoChallengeEnabled,
  setPhotoChallengeEnabled,
  isLoading,
  hasChanges,
  onSave,
  onDirty,
}: FeaturesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Event Features
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enable or disable features for your event
          </p>
        </div>
        {hasChanges && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Unsaved changes
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureToggleCard
          title="Lucky Draw"
          description="Allow guests to enter photos into draws"
          enabled={luckyDrawEnabled}
          onToggle={(nextValue) => {
            setLuckyDrawEnabled(nextValue);
            onDirty();
          }}
          icon={Sparkles}
        />
        <FeatureToggleCard
          title="Attendance Check-in"
          description="Allow guests to check in to the event"
          enabled={attendanceEnabled}
          onToggle={(nextValue) => {
            setAttendanceEnabled(nextValue);
            onDirty();
          }}
          icon={Users}
        />
        <FeatureToggleCard
          title="Photo Challenge"
          description="Motivate guests with photo goals"
          enabled={photoChallengeEnabled}
          onToggle={(nextValue) => {
            setPhotoChallengeEnabled(nextValue);
            onDirty();
          }}
          icon={Target}
        />
        <FeatureToggleCard
          title="Photo Downloads"
          description="Guests can download photos"
          enabled={guestDownloadEnabled}
          onToggle={(nextValue) => {
            setGuestDownloadEnabled(nextValue);
            onDirty();
          }}
          icon={Download}
        />
        <FeatureToggleCard
          title="Photo Moderation"
          description="Require approval before showing photos"
          enabled={moderationRequired}
          onToggle={(nextValue) => {
            setModerationRequired(nextValue);
            onDirty();
          }}
          icon={Eye}
        />
        <FeatureToggleCard
          title="Anonymous Uploads"
          description="Allow guests to upload without name"
          enabled={anonymousAllowed}
          onToggle={(nextValue) => {
            setAnonymousAllowed(nextValue);
            onDirty();
          }}
          icon={Hash}
        />
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
