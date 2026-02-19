import clsx from 'clsx';
import { History, Loader2, RefreshCw } from 'lucide-react';
import type { Winner } from '@/lib/types';
import type { DrawHistoryConfig, LuckyDrawHistoryItem } from '../types';

interface HistoryTabProps {
  drawHistory: LuckyDrawHistoryItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function HistoryTab({
  drawHistory,
  isLoading,
  isRefreshing,
  onRefresh,
}: HistoryTabProps) {
  const completedDraws = drawHistory.filter((d) => d.status === 'completed');
  const hasDraws = drawHistory.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Draw History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {completedDraws.length} completed {completedDraws.length === 1 ? 'draw' : 'draws'}
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : !hasDraws ? (
        <div className="text-center py-12">
          <History className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Draw History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Completed draws will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {drawHistory.map((draw) => (
            <DrawHistoryItem
              key={draw.configId}
              config={{
                id: draw.configId,
                status: draw.status,
                prizeTiers: draw.prizeTiers,
                totalEntries: draw.totalEntries,
                createdAt: draw.createdAt,
                completedAt: draw.completedAt,
              }}
              winnerCount={draw.winnerCount}
              winners={draw.winners}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DrawHistoryItem({
  config,
  winnerCount,
  winners,
}: {
  config: DrawHistoryConfig;
  winnerCount: number;
  winners: Winner[];
}) {
  const createdAt = new Date(config.createdAt).toLocaleDateString();
  const completedAt = config.completedAt
    ? new Date(config.completedAt).toLocaleString()
    : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Draw: {createdAt}
          </span>
        </div>

        <span className={clsx(
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
          config.status === 'completed'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
          config.status === 'cancelled'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        )}>
          {config.status === 'completed' && 'Completed'}
          {config.status === 'cancelled' && 'Cancelled'}
          {config.status === 'scheduled' && 'Scheduled'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Total Prizes:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
            {config.prizeTiers.reduce((sum, tier) => sum + tier.count, 0)}
          </span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Winners:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
            {winnerCount}
          </span>
        </div>
        {completedAt && (
          <div>
            <span className="text-gray-600 dark:text-gray-400">Completed:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {completedAt}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Prizes:</p>
        <div className="flex flex-wrap gap-1">
          {config.prizeTiers.map((tier, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded bg-violet-100 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
            >
              {tier.count}x {tier.name}
            </span>
          ))}
        </div>
      </div>

      {winners.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Winners:
          </p>
          <div className="space-y-2">
            {winners
              .sort((a, b) => a.selectionOrder - b.selectionOrder)
              .map((winner) => (
                <div
                  key={winner.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {winner.selectionOrder}. {winner.participantName}
                    </span>
                    {winner.isClaimed && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Claimed
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {winner.prizeName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {winner.prizeTier}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
