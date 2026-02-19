import type { Dispatch, SetStateAction } from 'react';
import clsx from 'clsx';
import { Check, Loader2 } from 'lucide-react';
import type { EventStatus } from '../types';

interface AdvancedTabProps {
  shortCode: string;
  setShortCode: Dispatch<SetStateAction<string>>;
  customHashtag: string;
  setCustomHashtag: Dispatch<SetStateAction<string>>;
  eventStatus: EventStatus;
  setEventStatus: Dispatch<SetStateAction<EventStatus>>;
  isLoading: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onDirty: () => void;
}

export function AdvancedTab({
  shortCode,
  setShortCode,
  customHashtag,
  setCustomHashtag,
  eventStatus,
  setEventStatus,
  isLoading,
  hasChanges,
  onSave,
  onDirty,
}: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Advanced Settings
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Additional configuration options
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
            Custom URL Code
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">/e/</span>
            <input
              type="text"
              value={shortCode}
              onChange={(event) => {
                const value = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setShortCode(value);
                onDirty();
              }}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              placeholder="my-event"
              maxLength={50}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Lowercase letters, numbers, hyphens only
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom Hashtag
          </label>
          <input
            type="text"
            value={customHashtag}
            onChange={(event) => {
              const value = event.target.value.replace(/[^a-zA-Z0-9_]/g, '');
              setCustomHashtag(value);
              onDirty();
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            placeholder="myevent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Letters, numbers, and underscores only
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Event Status
          </label>
          <select
            value={eventStatus}
            onChange={(event) => { setEventStatus(event.target.value as EventStatus); onDirty(); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="archived">Archived</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Control event visibility
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
