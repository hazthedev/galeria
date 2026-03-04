// ============================================
// Lucky Draw Domain Types
// ============================================

export type AnimationStyle = 'slot';

export type PrizeTier = 'first' | 'second' | 'third' | 'consolation';

export type DrawStatus = 'scheduled' | 'completed' | 'cancelled';

// Legacy types (Phase 4 and earlier)
export interface ILuckyDrawEntry {
  id: string;
  event_id: string;
  participant_name: string;
  selfie_url: string;
  contact_info?: string; // encrypted
  user_fingerprint: string;
  agreed_to_display: boolean;
  entry_timestamp: Date;
  is_winner: boolean;
  prize_tier?: number;
  metadata: {
    ip_address: string; // hashed
    device_type: string;
  };
  created_at: Date;
}

export interface ILuckyDrawEntryCreate {
  event_id: string;
  participant_name: string;
  selfie_url: string;
  contact_info?: string;
  agreed_to_display: boolean;
}

export interface ILuckyDrawConfig {
  number_of_winners: number;
  animation_style: AnimationStyle;
  animation_duration: number;
  show_selfie: boolean;
  show_full_name: boolean;
  play_sound: boolean;
  confetti_animation: boolean;
}

export interface IWinner {
  id: string;
  event_id: string;
  entry_id: string;
  participant_name: string;
  selfie_url: string;
  prize_tier: number;
  drawn_at: Date;
  drawn_by: string; // admin user_id
  is_claimed: boolean;
  notes?: string;
}

// New Phase 5 types
export interface IPrizeTier {
  tier: PrizeTier;
  name: string;
  description?: string;
  count: number;
}

export interface ILuckyDrawConfigV2 {
  id: string;
  eventId: string;
  prizeTiers: IPrizeTier[];
  maxEntriesPerUser: number;
  requirePhotoUpload: boolean;
  preventDuplicateWinners: boolean;
  animationStyle: AnimationStyle;
  animationDuration: number;
  showSelfie: boolean;
  showFullName: boolean;
  playSound: boolean;
  confettiAnimation: boolean;
  status: DrawStatus;
  totalEntries: number;
  scheduledAt?: Date;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILuckyDrawEntryV2 {
  id: string;
  eventId: string;
  configId: string;
  photoId?: string | null;
  userFingerprint: string;
  participantName?: string | null;
  isWinner: boolean;
  prizeTier?: PrizeTier;
  createdAt: Date;
}

export interface IWinnerV2 {
  id: string;
  eventId: string;
  entryId: string;
  participantName: string;
  selfieUrl: string;
  prizeTier: PrizeTier;
  prizeName: string;
  prizeDescription: string;
  selectionOrder: number;
  isClaimed: boolean;
  drawnAt: Date;
  notifiedAt?: Date;
  createdAt: Date;
}

// Type aliases for backward compatibility
export type LuckyDrawConfig = ILuckyDrawConfigV2;
export type LuckyDrawEntry = ILuckyDrawEntryV2;
export type Winner = IWinnerV2;
export type NewLuckyDrawConfig = Omit<ILuckyDrawConfigV2, 'id' | 'status' | 'totalEntries' | 'createdAt' | 'updatedAt'>;
export type NewLuckyDrawEntry = Omit<ILuckyDrawEntryV2, 'id' | 'createdAt'>;
export type NewWinner = Omit<IWinnerV2, 'id' | 'createdAt'>;
