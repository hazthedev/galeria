import type { AnimationStyle, LuckyDrawConfig, Winner } from '@/lib/types';

export type SubTab = 'config' | 'entries' | 'participants' | 'draw' | 'history';

export interface LuckyDrawHistoryItem {
  configId: string;
  status: LuckyDrawConfig['status'];
  prizeTiers: LuckyDrawConfig['prizeTiers'];
  totalEntries: LuckyDrawConfig['totalEntries'];
  createdAt: LuckyDrawConfig['createdAt'];
  completedAt: LuckyDrawConfig['completedAt'];
  winners: Winner[];
  winnerCount: number;
}

export interface LuckyDrawParticipant {
  userFingerprint: string;
  participantName?: string | null;
  entryCount: number;
  isWinner: boolean;
  prizeTier: LuckyDrawConfig['prizeTiers'][number]['tier'] | null;
  firstEntryAt: string | null;
  lastEntryAt: string | null;
}

export interface ParticipantsSummary {
  total: number;
  uniqueParticipants: number;
  totalEntries: number;
}

export type PrizeTierForm = {
  tier: LuckyDrawConfig['prizeTiers'][number]['tier'];
  name: string;
  count: number;
  description: string;
};

export type ConfigFormState = {
  prizeTiers: PrizeTierForm[];
  maxEntriesPerUser: number;
  requirePhotoUpload: boolean;
  preventDuplicateWinners: boolean;
  animationStyle: AnimationStyle;
  animationDuration: number;
  showSelfie: boolean;
  showFullName: boolean;
  playSound: boolean;
  confettiAnimation: boolean;
};

export type DrawHistoryConfig = Pick<
  LuckyDrawConfig,
  'id' | 'status' | 'prizeTiers' | 'totalEntries' | 'createdAt' | 'completedAt'
>;
