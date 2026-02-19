import type { Dispatch, SetStateAction } from 'react';
import clsx from 'clsx';
import { Check, Loader2 } from 'lucide-react';
import type { EventType } from '@/lib/types';

interface BasicTabProps {
  eventName: string;
  setEventName: Dispatch<SetStateAction<string>>;
  eventType: EventType;
  setEventType: Dispatch<SetStateAction<EventType>>;
  eventDate: string;
  setEventDate: Dispatch<SetStateAction<string>>;
  location: string;
  setLocation: Dispatch<SetStateAction<string>>;
  expectedGuests: number;
  setExpectedGuests: Dispatch<SetStateAction<number>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  isLoading: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onDirty: () => void;
}

export function BasicTab({
  eventName,
  setEventName,
  eventType,
  setEventType,
  eventDate,
  setEventDate,
  location,
  setLocation,
  expectedGuests,
  setExpectedGuests,
  description,
  setDescription,
  isLoading,
  hasChanges,
  onSave,
  onDirty,
}: BasicTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Basic Information
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Edit the basic details of your event
          </p>
        </div>
        {hasChanges && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Unsaved changes
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(event) => { setEventName(event.target.value); onDirty(); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              placeholder="My Awesome Event"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Event Type <span className="text-red-500">*</span>
            </label>
            <select
              value={eventType}
              onChange={(event) => { setEventType(event.target.value as EventType); onDirty(); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="birthday">Birthday</option>
              <option value="wedding">Wedding</option>
              <option value="corporate">Corporate</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Event Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(event) => { setEventDate(event.target.value); onDirty(); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(event) => { setLocation(event.target.value); onDirty(); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              placeholder="Venue name or address"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Expected Guests
            </label>
            <input
              type="number"
              min="1"
              max="100000"
              value={expectedGuests}
              onChange={(event) => { setExpectedGuests(parseInt(event.target.value) || 0); onDirty(); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              placeholder="100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) => { setDescription(event.target.value); onDirty(); }}
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            placeholder="Describe your event..."
          />
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
