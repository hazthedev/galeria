import type { Dispatch, SetStateAction } from 'react';
import clsx from 'clsx';
import { Check, Loader2 } from 'lucide-react';
import type { UploadRateLimits } from '../types';

interface SecurityTabProps {
  uploadRateLimits: UploadRateLimits;
  setUploadRateLimits: Dispatch<SetStateAction<UploadRateLimits>>;
  isLoading: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onDirty: () => void;
}

export function SecurityTab({
  uploadRateLimits,
  setUploadRateLimits,
  isLoading,
  hasChanges,
  onSave,
  onDirty,
}: SecurityTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Upload Security Limits
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure rate limits to prevent spam and abuse
          </p>
        </div>
        {hasChanges && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Unsaved changes
          </span>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Per User
          </label>
          <input
            type="number"
            min="1"
            value={uploadRateLimits.per_user_hourly}
            onChange={(event) => setUploadRateLimits({
              ...uploadRateLimits,
              per_user_hourly: parseInt(event.target.value) || 1,
            })}
            onBlur={onDirty}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Max uploads per user
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Burst Protection
          </label>
          <input
            type="number"
            min="1"
            value={uploadRateLimits.burst_per_ip_minute}
            onChange={(event) => setUploadRateLimits({
              ...uploadRateLimits,
              burst_per_ip_minute: parseInt(event.target.value) || 1,
            })}
            onBlur={onDirty}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Max rapid uploads per minute
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Per Event
          </label>
          <input
            type="number"
            min="1"
            value={uploadRateLimits.per_event_daily}
            onChange={(event) => setUploadRateLimits({
              ...uploadRateLimits,
              per_event_daily: parseInt(event.target.value) || 1,
            })}
            onBlur={onDirty}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Max total uploads
          </p>
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
