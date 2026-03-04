// ============================================
// Tenant Domain Types
// ============================================

export type TenantType = 'master' | 'white_label' | 'demo';

export type TenantStatus = 'active' | 'suspended' | 'trial';

export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'enterprise' | 'tester';

export interface ITenantBranding {
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  logo_url?: string;
  favicon_url?: string;
  background_image?: string;
  font_family?: string;
  custom_css?: string;
}

export interface ITenantFeatures {
  lucky_draw: boolean;
  photo_reactions: boolean;
  video_uploads: boolean;
  custom_templates: boolean;
  api_access: boolean;
  sso: boolean;
  white_label: boolean;
  advanced_analytics: boolean;
}

export interface ITenantLimits {
  max_events_per_month: number;
  max_storage_gb: number;
  max_admins: number;
  max_photos_per_event: number;
  max_draw_entries_per_event: number;
  custom_features: string[];
}

export interface ITenant {
  id: string;
  tenant_type: TenantType;
  brand_name: string;
  company_name: string;
  contact_email: string;
  support_email?: string;
  phone?: string;
  domain?: string;
  subdomain?: string;
  is_custom_domain: boolean;
  branding: ITenantBranding;
  subscription_tier: SubscriptionTier;
  features_enabled: ITenantFeatures;
  limits: ITenantLimits;
  status: TenantStatus;
  trial_ends_at?: Date;
  subscription_ends_at?: Date;
  created_at: Date;
  updated_at: Date;
}
