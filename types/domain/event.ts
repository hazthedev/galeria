// ============================================
// Event Domain Types
// ============================================

export type EventType = 'birthday' | 'wedding' | 'corporate' | 'other';

export type EventStatus = 'draft' | 'active' | 'ended' | 'archived';

export interface IEventTheme {
  primary_color: string;
  secondary_color: string;
  background: string;
  surface_color?: string;
  logo_url?: string;
  frame_template: string;
  photo_card_style?: string;
}

export interface IEventFeatures {
  photo_upload_enabled: boolean;
  lucky_draw_enabled: boolean;
  reactions_enabled: boolean;
  moderation_required: boolean;
  anonymous_allowed: boolean;
  guest_download_enabled: boolean;
  photo_challenge_enabled: boolean;
  attendance_enabled: boolean;
}

export interface IEventLimits {
  max_photos_per_user: number;
  max_total_photos: number;
  max_draw_entries: number;
}

export interface IEventSettings {
  theme: IEventTheme;
  features: IEventFeatures;
  limits: IEventLimits;
  security?: {
    upload_rate_limits: {
      per_ip_hourly: number;
      per_fingerprint_hourly: number;
      burst_per_ip_minute: number;
      per_event_daily: number;
    };
  };
}

export interface IUploadRateLimitOverrides {
  per_user_hourly?: number;
  per_ip_hourly?: number; // Deprecated, use per_user_hourly
  per_fingerprint_hourly?: number; // Deprecated, use per_user_hourly
  burst_per_ip_minute?: number;
  burst_per_fingerprint_minute?: number;
  per_event_daily?: number;
}

export interface IEvent {
  id: string;
  tenant_id: string;
  organizer_id: string;
  name: string;
  slug: string;
  short_code?: string | null;
  description?: string;
  event_type: EventType;
  event_date: Date;
  timezone: string;
  location?: string;
  expected_guests?: number;
  custom_hashtag?: string;
  settings: IEventSettings;
  status: EventStatus;
  qr_code_url: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IEventCreate {
  name: string;
  event_date: Date;
  event_type: EventType;
  description?: string;
  location?: string;
  expected_guests?: number;
  custom_hashtag?: string;
  settings?: Partial<IEventSettings>;
}

export interface IEventUpdate {
  name?: string;
  description?: string;
  event_date?: Date;
  event_type?: EventType;
  location?: string;
  settings?: Partial<IEventSettings>;
  status?: EventStatus;
  short_code?: string;
  slug?: string;
  qr_code_url?: string;
}
