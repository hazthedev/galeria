// ============================================
// Photo Domain Types
// ============================================

export type PhotoStatus = 'pending' | 'approved' | 'rejected';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export type ReactionType = 'heart' | 'clap' | 'laugh' | 'wow';

export interface IPhotoImage {
  original_url: string;
  thumbnail_url: string;
  medium_url: string;
  full_url: string;
  width: number;
  height: number;
  file_size: number;
  format: string;
}

export interface IPhotoReactions {
  heart: number;
  clap: number;
  laugh: number;
  wow: number;
}

export interface IPhotoMetadata {
  ip_address: string; // hashed
  user_agent: string;
  upload_timestamp: Date;
  device_type: DeviceType;
}

export interface IPhoto {
  id: string;
  event_id: string;
  user_fingerprint: string;
  images: IPhotoImage;
  caption?: string;
  contributor_name?: string;
  is_anonymous: boolean;
  status: PhotoStatus;
  reactions: IPhotoReactions;
  metadata: IPhotoMetadata;
  created_at: Date;
  approved_at?: Date;
}

export interface IPhotoCreate {
  event_id: string;
  images: IPhotoImage;
  caption?: string;
  contributor_name?: string;
  is_anonymous?: boolean;
}

export interface IReactionCreate {
  photo_id: string;
  type: ReactionType;
}

// Moderation types
export type ModerationActionType = 'approve' | 'reject' | 'delete' | 'review';

export interface IModerationResult {
  is_safe: boolean;
  confidence: number;
  labels: Array<{
    name: string;
    confidence: number;
  }>;
  flagged_reasons: string[];
}

export interface IModerationAction {
  photo_id: string;
  action: ModerationActionType;
  reason?: string;
  ban_user?: boolean;
}

export interface IPhotoModerationLog {
  id: string;
  photo_id?: string | null;
  event_id: string;
  tenant_id: string;
  moderator_id?: string | null;
  action: ModerationActionType;
  source?: string;
  photo_status?: string | null;
  image_url?: string | null;
  reason?: string;
  created_at: Date;
}
