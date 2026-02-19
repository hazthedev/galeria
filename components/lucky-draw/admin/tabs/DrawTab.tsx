import clsx from 'clsx';
import { CheckCircle2, Loader2, Settings, Trophy, Users } from 'lucide-react';
import type { LuckyDrawConfig } from '@/lib/types';

interface DrawTabProps {
  config: LuckyDrawConfig | null;
  entriesTotal: number;
  userRole: string | null;
  successMessage: string | null;
  drawInProgress: boolean;
  drawError: string | null;
  onExecuteDraw: () => void;
  onOpenConfig: () => void;
}

export function DrawTab({
  config,
  entriesTotal,
  userRole,
  successMessage,
  drawInProgress,
  drawError,
  onExecuteDraw,
  onOpenConfig,
}: DrawTabProps) {
  const totalPrizes = config?.prizeTiers.reduce((sum, tier) => sum + tier.count, 0) || 0;
  const isAdmin = userRole === 'super_admin' || userRole === 'organizer';

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
        </div>
      )}

      {!config ? (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Draw Configuration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Configure a draw before you can execute it.
          </p>
          <button
            onClick={onOpenConfig}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Settings className="h-4 w-4" />
            Go to Configuration
          </button>
        </div>
      ) : (
        <>
          <DrawStatsCard
            config={config}
            entryCount={entriesTotal}
          />

          {isAdmin && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Execute Draw
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Once you execute the draw, winners will be selected randomly and cannot be undone.
              </p>
              {entriesTotal < totalPrizes && entriesTotal > 0 && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mb-4">
                  Warning: Only {entriesTotal} entries available for {totalPrizes} prizes
                </p>
              )}
              <button
                onClick={onExecuteDraw}
                disabled={drawInProgress}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-colors',
                  'bg-gradient-to-r from-violet-600 to-pink-600 text-white',
                  'hover:from-violet-700 hover:to-pink-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {drawInProgress ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Executing Draw...
                  </>
                ) : (
                  <>
                    <Trophy className="h-5 w-5" />
                    Execute Lucky Draw
                  </>
                )}
              </button>
              {drawError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {drawError}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DrawStatsCard({
  config,
  entryCount,
}: {
  config: LuckyDrawConfig;
  entryCount: number;
}) {
  const totalPrizes = config?.prizeTiers.reduce((sum, tier) => sum + tier.count, 0) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <Users className="h-8 w-8 text-violet-600 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Total Entries</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{entryCount}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <Trophy className="h-8 w-8 text-violet-600 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Total Prizes</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalPrizes}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <Settings className="h-8 w-8 text-violet-600 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
          {config?.status || 'Unknown'}
        </p>
      </div>
    </div>
  );
}
