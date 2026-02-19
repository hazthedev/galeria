import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Copy, Loader2, RefreshCw, Upload, Users } from 'lucide-react';
import type { LuckyDrawConfig, LuckyDrawEntry } from '@/lib/types';

interface EntriesTabProps {
  entries: LuckyDrawEntry[];
  entriesTotal: number;
  entriesPage: number;
  entriesPageSize: number;
  isLoading: boolean;
  isRefreshing: boolean;
  userRole: string | null;
  config: LuckyDrawConfig | null;
  manualEntryName: string;
  manualEntryCount: number;
  manualEntryFingerprint: string;
  manualEntryPhotoId: string;
  manualEntrySubmitting: boolean;
  manualEntryError: string | null;
  manualEntrySuccess: string | null;
  photoUploading: boolean;
  onRefresh: () => void;
  onSubmitManualEntry: (event: FormEvent<HTMLFormElement>) => void;
  onGenerateParticipantUUID: () => void;
  onPhotoUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  setEntriesPage: Dispatch<SetStateAction<number>>;
  setManualEntryName: Dispatch<SetStateAction<string>>;
  setManualEntryCount: Dispatch<SetStateAction<number>>;
  setManualEntryFingerprint: Dispatch<SetStateAction<string>>;
  setManualEntryPhotoId: Dispatch<SetStateAction<string>>;
}

export function EntriesTab({
  entries,
  entriesTotal,
  entriesPage,
  entriesPageSize,
  isLoading,
  isRefreshing,
  userRole,
  config,
  manualEntryName,
  manualEntryCount,
  manualEntryFingerprint,
  manualEntryPhotoId,
  manualEntrySubmitting,
  manualEntryError,
  manualEntrySuccess,
  photoUploading,
  onRefresh,
  onSubmitManualEntry,
  onGenerateParticipantUUID,
  onPhotoUpload,
  setEntriesPage,
  setManualEntryName,
  setManualEntryCount,
  setManualEntryFingerprint,
  setManualEntryPhotoId,
}: EntriesTabProps) {
  const hasEntries = entriesTotal > 0;
  const totalPages = Math.max(1, Math.ceil(entriesTotal / entriesPageSize));
  const hasNextPage = (entriesPage + 1) * entriesPageSize < entriesTotal;
  const hasPrevPage = entriesPage > 0;
  const isAdmin = userRole === 'super_admin' || userRole === 'organizer';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Draw Entries
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {entriesTotal} total {entriesTotal === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-gray-50 dark:hover:bg-gray-800',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw className={clsx('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {isAdmin && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Manual Entry
          </h4>
          <form onSubmit={onSubmitManualEntry} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Participant name
                </label>
                <input
                  type="text"
                  value={manualEntryName}
                  onChange={(event) => setManualEntryName(event.target.value)}
                  className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Alex Tan"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Entries to add
                </label>
                <input
                  type="number"
                  min={1}
                  value={manualEntryCount}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setManualEntryCount(Number.isFinite(value) && value > 0 ? Math.floor(value) : 1);
                  }}
                  className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Participant ID (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualEntryFingerprint}
                    onChange={(event) => setManualEntryFingerprint(event.target.value)}
                    className="flex-1 rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                  <button
                    type="button"
                    onClick={onGenerateParticipantUUID}
                    className="inline-flex items-center gap-1 rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
                    title="Generate UUID"
                  >
                    <Copy className="h-4 w-4" />
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Photo ID {config?.requirePhotoUpload ? '(required)' : '(optional)'}
                </label>
                {config?.requirePhotoUpload ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualEntryPhotoId}
                        onChange={(event) => setManualEntryPhotoId(event.target.value)}
                        className="flex-1 rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="Upload a photo below to auto-fill"
                        readOnly
                      />
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"
                        disabled
                      >
                        Auto-filled
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-violet-300 bg-violet-50 px-4 py-2 text-sm text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50 cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onPhotoUpload}
                          disabled={photoUploading}
                          className="hidden"
                        />
                        {photoUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                      </label>
                      <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                        Required - upload a photo first
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualEntryPhotoId}
                        onChange={(event) => setManualEntryPhotoId(event.target.value)}
                        className="flex-1 rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="Not needed - leave empty"
                      />
                      <button
                        type="button"
                        onClick={() => setManualEntryPhotoId('')}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        title="Clear field"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Photos not required for this draw. Leave empty.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {manualEntryError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {manualEntryError}
              </div>
            )}

            {manualEntrySuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200">
                {manualEntrySuccess}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={manualEntrySubmitting || !config}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                  'bg-gradient-to-r from-violet-600 to-pink-600',
                  'hover:from-violet-700 hover:to-pink-700',
                  (manualEntrySubmitting || !config) && 'opacity-70 cursor-not-allowed'
                )}
              >
                {manualEntrySubmitting ? 'Adding...' : 'Add Manual Entry'}
              </button>
              {!config && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Create a draw configuration before adding entries.
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : !hasEntries ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Entries Yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Entries will be created automatically when users upload photos to this event.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setEntriesPage((p) => Math.max(0, p - 1))}
                disabled={!hasPrevPage}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-gray-50 dark:hover:bg-gray-800',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {entriesPage + 1} of {totalPages}
              </span>

              <button
                onClick={() => setEntriesPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={!hasNextPage}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-gray-50 dark:hover:bg-gray-800',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EntryCard({ entry }: { entry: LuckyDrawEntry }) {
  const date = new Date(entry.createdAt).toLocaleDateString();
  const time = new Date(entry.createdAt).toLocaleTimeString();
  const participantName = entry.participantName?.trim();
  const entryLabel = `Entry: ${entry.id.slice(0, 8)}...`;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden">
        <span className="text-xs text-violet-600 dark:text-violet-400">
          Photo
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {participantName || entryLabel}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {participantName ? `${entryLabel} - ${date} at ${time}` : `${date} at ${time}`}
        </p>
      </div>

      {entry.isWinner && (
        <span className="flex-shrink-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-2.5 py-0.5 text-xs font-medium text-white">
          Winner
        </span>
      )}
    </div>
  );
}
