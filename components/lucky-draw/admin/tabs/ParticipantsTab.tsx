import clsx from 'clsx';
import { Loader2, RefreshCw, Users } from 'lucide-react';
import type { LuckyDrawParticipant, ParticipantsSummary } from '../types';

interface ParticipantsTabProps {
  participants: LuckyDrawParticipant[];
  participantsSummary: ParticipantsSummary;
  participantsLoading: boolean;
  participantsError: string | null;
  onRefresh: () => void;
}

export function ParticipantsTab({
  participants,
  participantsSummary,
  participantsLoading,
  participantsError,
  onRefresh,
}: ParticipantsTabProps) {
  const hasParticipants = participants.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Participants
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {participantsSummary.uniqueParticipants} participant
            {participantsSummary.uniqueParticipants === 1 ? '' : 's'} - {participantsSummary.totalEntries} entries
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={participantsLoading}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-gray-50 dark:hover:bg-gray-800',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw className={clsx('h-4 w-4', participantsLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {participantsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {participantsError}
        </div>
      )}

      {participantsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : !hasParticipants ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Participants Yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Participants will appear once entries are created.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {participants.map((participant) => {
            const name = participant.participantName?.trim()
              || `Participant ${participant.userFingerprint.slice(0, 8)}`;
            const firstEntry = participant.firstEntryAt
              ? new Date(participant.firstEntryAt).toLocaleDateString()
              : 'Unknown';
            const lastEntry = participant.lastEntryAt
              ? new Date(participant.lastEntryAt).toLocaleDateString()
              : 'Unknown';

            return (
              <div
                key={participant.userFingerprint}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    ID: {participant.userFingerprint}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    First entry: {firstEntry} - Last entry: {lastEntry}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {participant.entryCount} {participant.entryCount === 1 ? 'entry' : 'entries'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {participant.isWinner ? 'Winner' : 'Participant'}
                    </p>
                  </div>
                  {participant.isWinner && (
                    <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Winner
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
