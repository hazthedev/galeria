// ============================================
// Photo Challenge Domain Types
// ============================================

export interface IPhotoChallenge {
  id: string;
  event_id: string;
  goal_photos: number;
  prize_title: string;
  prize_description?: string | null;
  prize_tier?: string | null;
  enabled: boolean;
  auto_grant: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IPhotoChallengeCreate {
  goal_photos: number;
  prize_title: string;
  prize_description?: string;
  prize_tier?: string;
  auto_grant?: boolean;
}

export interface IPhotoChallengeUpdate {
  goal_photos?: number;
  prize_title?: string;
  prize_description?: string;
  prize_tier?: string;
  enabled?: boolean;
  auto_grant?: boolean;
}

export interface IGuestPhotoProgress {
  id: string;
  event_id: string;
  user_fingerprint: string;
  photos_uploaded: number;
  photos_approved: number;
  goal_reached: boolean;
  prize_claimed_at?: Date | null;
  prize_revoked: boolean;
  revoke_reason?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface IPrizeClaim {
  id: string;
  event_id: string;
  user_fingerprint: string;
  challenge_id?: string | null;
  qr_code_token: string;
  claimed_at: Date;
  revoked_at?: Date | null;
  revoke_reason?: string | null;
  verified_by?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
}

export interface IPrizeClaimRevoke {
  user_fingerprint: string;
  reason: string;
}
