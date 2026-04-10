export interface AdminOverviewStats {
  totalUsers: number;
  totalEvents: number;
  totalPhotos: number;
  activeEvents: number;
  recentUsers: number;
  totalTenants: number;
  mfaEnabledUsers: number;
  totalLuckyDraws: number;
  totalWinners: number;
  pendingPhotos: number;
}

export const EMPTY_ADMIN_OVERVIEW_STATS: AdminOverviewStats = {
  totalUsers: 0,
  totalEvents: 0,
  totalPhotos: 0,
  activeEvents: 0,
  recentUsers: 0,
  totalTenants: 0,
  mfaEnabledUsers: 0,
  totalLuckyDraws: 0,
  totalWinners: 0,
  pendingPhotos: 0,
};

export type AdminActivityType = 'user' | 'event' | 'photo' | 'moderation';

export interface AdminActivityItem {
  id: string;
  type: AdminActivityType;
  createdAt: string;
  tenantName?: string | null;
  eventId?: string | null;
  eventName?: string | null;
  eventStatus?: string | null;
  organizerName?: string | null;
  contributorName?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  moderatorName?: string | null;
  moderatorEmail?: string | null;
  action?: string | null;
  photoStatus?: string | null;
  reason?: string | null;
  imageUrl?: string | null;
}

export interface AdminOverviewData {
  stats: AdminOverviewStats;
  recentActivity: AdminActivityItem[];
}

export type AdminSearchEntityType = 'tenant' | 'event' | 'user';

export interface AdminSearchResult {
  id: string;
  type: AdminSearchEntityType;
  title: string;
  subtitle: string | null;
  description: string | null;
  status: string | null;
  href: string;
  createdAt: string | null;
  tenantId: string | null;
  tenantName: string | null;
}

export interface AdminSearchData {
  query: string;
  results: AdminSearchResult[];
  counts: Record<AdminSearchEntityType, number>;
  limit: number;
}

export const EMPTY_ADMIN_SEARCH_COUNTS: Record<AdminSearchEntityType, number> = {
  tenant: 0,
  event: 0,
  user: 0,
};

export type AdminTenantStatus = 'active' | 'suspended' | 'trialing';
export type AdminSubscriptionTier = 'free' | 'pro' | 'premium' | 'enterprise' | 'tester';

export interface AdminTenantListItem {
  id: string;
  company_name: string;
  slug: string;
  subscription_tier: AdminSubscriptionTier;
  status: AdminTenantStatus;
  created_at: string;
  updated_at: string;
  event_count: number;
  user_count: number;
  photo_count: number;
}

export interface AdminTenantSummary extends AdminTenantListItem {
  brand_name: string | null;
  contact_email: string | null;
  support_email: string | null;
  domain: string | null;
  subdomain: string | null;
  features_enabled: Record<string, boolean> | null;
  limits: Record<string, unknown> | null;
  active_events_count: number;
  organizer_count: number;
  guest_count: number;
  pending_photos_count: number;
}

export interface AdminTenantUserSummary {
  id: string;
  name: string | null;
  email: string;
  role: 'guest' | 'organizer' | 'super_admin';
  created_at: string;
  last_login_at: string | null;
  totp_enabled: boolean;
}

export interface AdminTenantEventSummary {
  id: string;
  name: string;
  short_code: string | null;
  status: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  photo_count: number;
}

export interface AdminAuditTimelineItem {
  id: string;
  action: string;
  reason: string | null;
  created_at: string;
  admin_name: string | null;
  admin_email: string | null;
}

export interface AdminTenantDetailData {
  tenant: AdminTenantSummary;
  recentUsers: AdminTenantUserSummary[];
  recentEvents: AdminTenantEventSummary[];
  recentAudit: AdminAuditTimelineItem[];
}

export interface AdminEventListItem {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string | null;
  name: string;
  short_code: string | null;
  status: string;
  event_date: string | null;
  expires_at: string | null;
  created_at: string;
  photo_count: number;
  guest_count: number;
  attendance_count: number;
}

export interface AdminEventUploadHealth {
  total_uploads: number;
  approved_uploads: number;
  pending_uploads: number;
  rejected_uploads: number;
  uploads_last_24h: number;
  last_upload_at: string | null;
  avg_processing_lag_seconds: number | null;
}

export interface AdminEventGalleryState {
  total_reactions: number;
}

export interface AdminEventAttendanceSummary {
  total_checkins: number;
  unique_attendees: number;
  total_guests: number;
  last_checkin_at: string | null;
}

export interface AdminEventLuckyDrawSummary {
  enabled: boolean;
  status: string | null;
  total_entries: number;
  total_winners: number;
  last_draw_at: string | null;
}

export interface AdminEventPhotoChallengeSummary {
  enabled: boolean;
  goal_photos: number | null;
  participant_count: number;
  goal_reached_count: number;
  claimed_count: number;
}

export interface AdminEventModerationSummary {
  pending_photos: number;
  rejected_photos: number;
  review_scans: number;
  rejected_scans: number;
  last_moderated_at: string | null;
}

export interface AdminEventModerationLogItem {
  id: string;
  action: string;
  source: string;
  photo_status: string | null;
  reason: string | null;
  created_at: string;
  moderator_name: string | null;
  moderator_email: string | null;
}

export interface AdminEventContributorSummary {
  id: string;
  name: string;
  email: string | null;
  photo_count: number;
}

export interface AdminEventSummary extends AdminEventListItem {
  description: string | null;
  location: string | null;
  qr_code_url: string;
  updated_at: string;
  organizer_id: string;
  organizer_name: string | null;
  organizer_email: string | null;
  tenant_tier: string | null;
  settings: Record<string, unknown> | null;
}

export interface AdminEventDetailData {
  event: AdminEventSummary;
  uploadHealth: AdminEventUploadHealth;
  galleryState: AdminEventGalleryState;
  attendance: AdminEventAttendanceSummary;
  luckyDraw: AdminEventLuckyDrawSummary;
  photoChallenge: AdminEventPhotoChallengeSummary;
  moderation: AdminEventModerationSummary;
  topContributors: AdminEventContributorSummary[];
  recentModeration: AdminEventModerationLogItem[];
  recentAudit: AdminAuditTimelineItem[];
}

export type AdminUserRole = 'guest' | 'organizer' | 'super_admin';

export interface AdminUserListItem {
  id: string;
  email: string;
  name: string | null;
  role: AdminUserRole;
  tenant_id: string;
  tenant_name: string | null;
  subscription_tier: string | null;
  user_subscription_tier: string | null;
  tenant_subscription_tier: string | null;
  created_at: string;
  last_login_at: string | null;
  email_verified: boolean;
  totp_enabled: boolean;
}

export interface AdminUserSessionSummary {
  session_id: string;
  created_at: number;
  last_activity: number;
  expires_at: number;
  remember_me: boolean;
  ip_address: string | null;
  user_agent: string | null;
  device_info: string;
  is_current: boolean;
  ttl: number;
}

export interface AdminUserRelatedEventSummary {
  id: string;
  name: string;
  short_code: string | null;
  status: string;
  event_date: string | null;
  created_at: string;
}

export interface AdminUserDetailData {
  user: AdminUserListItem;
  session_count: number;
  active_session_count: number;
  tenant_status: string | null;
  tenant_slug: string | null;
  relatedEvents: AdminUserRelatedEventSummary[];
  recentSessions: AdminUserSessionSummary[];
  recentAudit: AdminAuditTimelineItem[];
}

export interface AdminSessionListItem {
  sessionId: string;
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  name: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
  rememberMe: boolean;
  ttl: number;
  isCurrent: boolean;
  deviceInfo: string;
}

export interface AdminSessionsData {
  data: AdminSessionListItem[];
  grouped: Record<string, AdminSessionListItem[]>;
  total: number;
  uniqueUsers: number;
}

export interface AdminAuditLogItem {
  id: string;
  admin_id: string;
  admin_name?: string | null;
  admin_email?: string | null;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  reason?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface AdminModerationQueueItem {
  photo_id: string;
  tenant_id: string;
  tenant_name: string;
  event_id: string;
  event_name: string;
  event_short_code: string | null;
  contributor_name: string | null;
  photo_status: string;
  image_url: string | null;
  latest_scan_decision: string | null;
  latest_scan_outcome: string | null;
  latest_scan_reason: string | null;
  latest_scan_at: string | null;
  latest_moderation_action: string | null;
  latest_moderation_source: string | null;
  latest_moderation_reason: string | null;
  latest_moderation_at: string | null;
  created_at: string;
}

export type AdminIncidentStatus = 'healthy' | 'warning' | 'critical';

export interface AdminIncidentServiceStatus {
  id: string;
  label: string;
  status: AdminIncidentStatus;
  summary: string;
  details: string | null;
  latency_ms: number | null;
  href: string | null;
}

export interface AdminIncidentSummary {
  critical_services: number;
  warning_services: number;
  pending_moderation: number;
  active_events: number;
  admin_mfa_gaps: number;
  failed_scans_24h: number;
  failed_admin_actions_24h: number;
}

export interface AdminIncidentFailureItem {
  id: string;
  type: 'scan_failure' | 'admin_action_failure';
  title: string;
  description: string | null;
  created_at: string;
  href: string | null;
}

export interface AdminIncidentsData {
  summary: AdminIncidentSummary;
  services: AdminIncidentServiceStatus[];
  recentFailures: AdminIncidentFailureItem[];
}
