// ============================================
// System Configuration Types
// ============================================

import type { ITenant } from '../domain/tenant';
import type { IUser } from '../domain/user';

export interface ISystemSettings {
  uploads: {
    max_file_mb: number;
    allowed_types: string[];
  };
  /** @deprecated AI moderation removed. Kept for schema compatibility. */
  moderation?: {
    enabled?: boolean;
    aws_region?: string;
    aws_access_key_id?: string;
    aws_secret_access_key?: string;
    confidence_threshold?: number;
    auto_reject?: boolean;
  };
  events: {
    default_settings: {
      theme: {
        primary_color: string;
        secondary_color: string;
        background: string;
        logo_url?: string;
        frame_template: string;
        photo_card_style?: string;
      };
      features: {
        photo_upload_enabled: boolean;
        lucky_draw_enabled: boolean;
        reactions_enabled: boolean;
        moderation_required: boolean;
        anonymous_allowed: boolean;
        guest_download_enabled: boolean;
        photo_challenge_enabled: boolean;
        attendance_enabled: boolean;
      };
    };
  };
}

export interface ITenantContext {
  tenant: ITenant;
  is_custom_domain: boolean;
  is_master: boolean;
}

export interface IRequestContext {
  tenant?: ITenant;
  user?: IUser;
  session_id?: string;
  fingerprint?: string;
}
