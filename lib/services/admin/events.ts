import 'server-only';

import { getAdminDb, isMissingSchemaResourceError } from '@/lib/domain/admin/context';
import type {
  AdminAuditTimelineItem,
  AdminEventAttendanceSummary,
  AdminEventContributorSummary,
  AdminEventDetailData,
  AdminEventGalleryState,
  AdminEventListItem,
  AdminEventLuckyDrawSummary,
  AdminEventModerationLogItem,
  AdminEventModerationSummary,
  AdminEventPhotoChallengeSummary,
  AdminEventSummary,
  AdminEventUploadHealth,
} from '@/lib/domain/admin/types';

export interface ListAdminEventsOptions {
  page: number;
  limit: number;
  status?: string | null;
  tenantId?: string | null;
  search?: string | null;
}

const adminEventStatuses = ['draft', 'active', 'ended', 'archived'] as const;

export type AdminEventStatus = (typeof adminEventStatuses)[number];

export interface AdminEventActionState {
  id: string;
  name: string;
  status: AdminEventStatus;
  settings: Record<string, unknown> | null;
}

interface AdminEventListCompatibilityOptions {
  includeTenantSlug: boolean;
  includeAttendanceMetrics: boolean;
}

interface AdminEventDetailCompatibilityOptions {
  includeTenantSlug: boolean;
  includeTenantTier: boolean;
  includeAttendanceMetrics: boolean;
  includeLuckyDraw: boolean;
  includePhotoChallenge: boolean;
  includePhotoScans: boolean;
  includeModerationLogs: boolean;
}

const FULL_ADMIN_EVENT_LIST_COMPATIBILITY: AdminEventListCompatibilityOptions = {
  includeTenantSlug: true,
  includeAttendanceMetrics: true,
};

const LEGACY_ADMIN_EVENT_LIST_COMPATIBILITY: AdminEventListCompatibilityOptions = {
  includeTenantSlug: false,
  includeAttendanceMetrics: false,
};

const FULL_ADMIN_EVENT_DETAIL_COMPATIBILITY: AdminEventDetailCompatibilityOptions = {
  includeTenantSlug: true,
  includeTenantTier: true,
  includeAttendanceMetrics: true,
  includeLuckyDraw: true,
  includePhotoChallenge: true,
  includePhotoScans: true,
  includeModerationLogs: true,
};

const LEGACY_ADMIN_EVENT_DETAIL_COMPATIBILITY: AdminEventDetailCompatibilityOptions = {
  includeTenantSlug: false,
  includeTenantTier: false,
  includeAttendanceMetrics: false,
  includeLuckyDraw: false,
  includePhotoChallenge: false,
  includePhotoScans: false,
  includeModerationLogs: false,
};

function toIsoString(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return new Date(value).toISOString();
  }

  return value.toISOString();
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function cloneEventSettings(settings: Record<string, unknown> | null) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return {} as Record<string, unknown>;
  }

  return { ...settings };
}

function cloneEventFeatures(settings: Record<string, unknown>) {
  const currentFeatures = settings['features'];

  if (!currentFeatures || typeof currentFeatures !== 'object' || Array.isArray(currentFeatures)) {
    return {} as Record<string, unknown>;
  }

  return { ...(currentFeatures as Record<string, unknown>) };
}

export function isAdminEventStatus(value: string): value is AdminEventStatus {
  return adminEventStatuses.includes(value as AdminEventStatus);
}

export function isAdminEventUploadsEnabled(settings: Record<string, unknown> | null): boolean {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return true;
  }

  const features = settings['features'];
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return true;
  }

  return (features as Record<string, unknown>)['photo_upload_enabled'] !== false;
}

function getAdminEventListTenantSlugSql(options: AdminEventListCompatibilityOptions): string {
  return options.includeTenantSlug ? 't.slug AS tenant_slug,' : 'NULL::text AS tenant_slug,';
}

function getAdminEventAttendanceSql(options: AdminEventListCompatibilityOptions): string {
  if (options.includeAttendanceMetrics) {
    return `
        (
          SELECT COALESCE(SUM(COALESCE(a.companions_count, 0) + 1), 0)
          FROM attendances a
          WHERE a.event_id = e.id
        ) AS guest_count,
        (
          SELECT COUNT(*)
          FROM attendances a
          WHERE a.event_id = e.id
        ) AS attendance_count
    `;
  }

  return `
        0::bigint AS guest_count,
        0::bigint AS attendance_count
  `;
}

function getAdminEventDetailTenantSlugSql(
  options: AdminEventDetailCompatibilityOptions
): string {
  return options.includeTenantSlug ? 't.slug AS tenant_slug,' : 'NULL::text AS tenant_slug,';
}

function getAdminEventDetailTenantTierSql(
  options: AdminEventDetailCompatibilityOptions
): string {
  return options.includeTenantTier
    ? 't.subscription_tier AS tenant_tier,'
    : 'NULL::text AS tenant_tier,';
}

function getAdminEventDetailAttendanceSql(
  options: AdminEventDetailCompatibilityOptions
): string {
  if (options.includeAttendanceMetrics) {
    return `
        (
          SELECT COUNT(*)
          FROM attendances a
          WHERE a.event_id = e.id
        ) AS total_checkins,
        (
          SELECT COUNT(DISTINCT COALESCE(a.guest_email, a.guest_phone, a.user_fingerprint, a.id::text))
          FROM attendances a
          WHERE a.event_id = e.id
        ) AS unique_attendees,
        (
          SELECT COALESCE(SUM(COALESCE(a.companions_count, 0) + 1), 0)
          FROM attendances a
          WHERE a.event_id = e.id
        ) AS total_guests,
        (
          SELECT MAX(a.created_at)
          FROM attendances a
          WHERE a.event_id = e.id
        ) AS last_checkin_at,
    `;
  }

  return `
        0::bigint AS total_checkins,
        0::bigint AS unique_attendees,
        0::bigint AS total_guests,
        NULL::timestamptz AS last_checkin_at,
  `;
}

function getAdminEventLuckyDrawSql(
  options: AdminEventDetailCompatibilityOptions
): string {
  if (options.includeLuckyDraw) {
    return `
        COALESCE((e.settings->'features'->>'lucky_draw_enabled')::boolean, false) AS lucky_draw_enabled,
        (
          SELECT ldc.status
          FROM lucky_draw_configs ldc
          WHERE ldc.event_id = e.id
          ORDER BY ldc.created_at DESC
          LIMIT 1
        ) AS lucky_draw_status,
        (
          SELECT COUNT(*)
          FROM lucky_draw_entries lde
          WHERE lde.event_id = e.id
        ) AS lucky_draw_entries,
        (
          SELECT COUNT(*)
          FROM winners w
          WHERE w.event_id = e.id
        ) AS lucky_draw_winners,
        (
          SELECT MAX(w.drawn_at)
          FROM winners w
          WHERE w.event_id = e.id
        ) AS last_draw_at,
    `;
  }

  return `
        COALESCE((e.settings->'features'->>'lucky_draw_enabled')::boolean, false) AS lucky_draw_enabled,
        NULL::text AS lucky_draw_status,
        0::bigint AS lucky_draw_entries,
        0::bigint AS lucky_draw_winners,
        NULL::timestamptz AS last_draw_at,
  `;
}

function getAdminEventPhotoChallengeSql(
  options: AdminEventDetailCompatibilityOptions
): string {
  if (options.includePhotoChallenge) {
    return `
        (
          SELECT pc.enabled
          FROM photo_challenges pc
          WHERE pc.event_id = e.id
          ORDER BY pc.created_at DESC
          LIMIT 1
        ) AS challenge_enabled,
        (
          SELECT pc.goal_photos
          FROM photo_challenges pc
          WHERE pc.event_id = e.id
          ORDER BY pc.created_at DESC
          LIMIT 1
        ) AS challenge_goal_photos,
        (
          SELECT COUNT(*)
          FROM guest_photo_progress gpp
          WHERE gpp.event_id = e.id
        ) AS challenge_participants,
        (
          SELECT COUNT(*)
          FROM guest_photo_progress gpp
          WHERE gpp.event_id = e.id
            AND gpp.goal_reached = true
        ) AS challenge_goal_reached_count,
        (
          SELECT COUNT(*)
          FROM prize_claims pc
          WHERE pc.event_id = e.id
            AND pc.revoked_at IS NULL
        ) AS challenge_claimed_count,
    `;
  }

  return `
        false AS challenge_enabled,
        NULL::integer AS challenge_goal_photos,
        0::bigint AS challenge_participants,
        0::bigint AS challenge_goal_reached_count,
        0::bigint AS challenge_claimed_count,
  `;
}

function getAdminEventPhotoScanSql(
  options: AdminEventDetailCompatibilityOptions
): string {
  if (options.includePhotoScans) {
    return `
        (
          SELECT COUNT(*)
          FROM photo_scan_logs psl
          WHERE psl.event_id = e.id
            AND psl.decision = 'review'
        ) AS review_scans,
        (
          SELECT COUNT(*)
          FROM photo_scan_logs psl
          WHERE psl.event_id = e.id
            AND psl.decision = 'reject'
        ) AS rejected_scans,
    `;
  }

  return `
        0::bigint AS review_scans,
        0::bigint AS rejected_scans,
  `;
}

function getAdminEventModerationLastActivitySql(
  options: AdminEventDetailCompatibilityOptions
): string {
  if (options.includeModerationLogs) {
    return `
        (
          SELECT MAX(pml.created_at)
          FROM photo_moderation_logs pml
          WHERE pml.event_id = e.id
        ) AS last_moderated_at
    `;
  }

  return 'NULL::timestamptz AS last_moderated_at';
}

async function listAdminEventsWithCompatibility(
  options: ListAdminEventsOptions,
  compatibility: AdminEventListCompatibilityOptions
) {
  const db = getAdminDb();
  const offset = (options.page - 1) * options.limit;

  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options.status && options.status !== 'all') {
    whereClause += ` AND e.status = $${paramIndex++}`;
    params.push(options.status);
  }

  if (options.tenantId && options.tenantId !== 'all') {
    whereClause += ` AND e.tenant_id = $${paramIndex++}`;
    params.push(options.tenantId);
  }

  if (options.search) {
    whereClause += `
      AND (
        e.name ILIKE $${paramIndex}
        OR e.short_code ILIKE $${paramIndex + 1}
        OR t.company_name ILIKE $${paramIndex + 2}
      )
    `;
    params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    paramIndex += 3;
  }

  const eventsResult = await db.query<{
    id: string;
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string | null;
    name: string;
    short_code: string | null;
    status: string;
    event_date: Date | string | null;
    expires_at: Date | string | null;
    created_at: Date;
    photo_count: string;
    guest_count: string;
    attendance_count: string;
  }>(
    `
      SELECT
        e.id,
        e.tenant_id,
        t.company_name AS tenant_name,
        ${getAdminEventListTenantSlugSql(compatibility)}
        e.name,
        e.short_code,
        e.status,
        e.event_date,
        e.expires_at,
        e.created_at,
        (
          SELECT COUNT(*)
          FROM photos p
          WHERE p.event_id = e.id
        ) AS photo_count,
        ${getAdminEventAttendanceSql(compatibility)}
      FROM events e
      LEFT JOIN tenants t ON t.id = e.tenant_id
      WHERE ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...params, options.limit, offset]
  );

  const countResult = await db.query<{ count: string }>(
    `
      SELECT COUNT(*) AS count
      FROM events e
      LEFT JOIN tenants t ON t.id = e.tenant_id
      WHERE ${whereClause}
    `,
    params
  );

  const items: AdminEventListItem[] = eventsResult.rows.map((row) => ({
    id: row.id,
    tenant_id: row.tenant_id,
    tenant_name: row.tenant_name,
    tenant_slug: row.tenant_slug,
    name: row.name,
    short_code: row.short_code,
    status: row.status,
    event_date: toIsoString(row.event_date),
    expires_at: toIsoString(row.expires_at),
    created_at: row.created_at.toISOString(),
    photo_count: toNumber(row.photo_count),
    guest_count: toNumber(row.guest_count),
    attendance_count: toNumber(row.attendance_count),
  }));

  const total = Number(countResult.rows[0]?.count || 0);

  return {
    items,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}

export async function listAdminEvents(options: ListAdminEventsOptions) {
  try {
    return await listAdminEventsWithCompatibility(options, FULL_ADMIN_EVENT_LIST_COMPATIBILITY);
  } catch (error) {
    if (isMissingSchemaResourceError(error)) {
      return listAdminEventsWithCompatibility(options, LEGACY_ADMIN_EVENT_LIST_COMPATIBILITY);
    }

    throw error;
  }
}

async function getAdminEventDetailWithCompatibility(
  eventId: string,
  compatibility: AdminEventDetailCompatibilityOptions
): Promise<AdminEventDetailData | null> {
  const db = getAdminDb();

  const eventResult = await db.query<{
    id: string;
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string | null;
    tenant_tier: string | null;
    name: string;
    short_code: string | null;
    description: string | null;
    location: string | null;
    status: string;
    event_date: Date | string | null;
    expires_at: Date | string | null;
    qr_code_url: string;
    created_at: Date;
    updated_at: Date;
    organizer_id: string;
    organizer_name: string | null;
    organizer_email: string | null;
    settings: Record<string, unknown> | null;
    total_uploads: string;
    approved_uploads: string;
    pending_uploads: string;
    rejected_uploads: string;
    uploads_last_24h: string;
    last_upload_at: Date | string | null;
    avg_processing_lag_seconds: string | null;
    total_reactions: string;
    total_checkins: string;
    unique_attendees: string;
    total_guests: string;
    last_checkin_at: Date | string | null;
    lucky_draw_enabled: boolean | null;
    lucky_draw_status: string | null;
    lucky_draw_entries: string;
    lucky_draw_winners: string;
    last_draw_at: Date | string | null;
    challenge_enabled: boolean | null;
    challenge_goal_photos: number | null;
    challenge_participants: string;
    challenge_goal_reached_count: string;
    challenge_claimed_count: string;
    review_scans: string;
    rejected_scans: string;
    last_moderated_at: Date | string | null;
  }>(
    `
      SELECT
        e.id,
        e.tenant_id,
        t.company_name AS tenant_name,
        ${getAdminEventDetailTenantSlugSql(compatibility)}
        ${getAdminEventDetailTenantTierSql(compatibility)}
        e.name,
        e.short_code,
        e.description,
        e.location,
        e.status,
        e.event_date,
        e.expires_at,
        e.qr_code_url,
        e.created_at,
        e.updated_at,
        e.organizer_id,
        organizer.name AS organizer_name,
        organizer.email AS organizer_email,
        e.settings,
        (
          SELECT COUNT(*)
          FROM photos p
          WHERE p.event_id = e.id
        ) AS total_uploads,
        (
          SELECT COUNT(*)
          FROM photos p
          WHERE p.event_id = e.id AND p.status = 'approved'
        ) AS approved_uploads,
        (
          SELECT COUNT(*)
          FROM photos p
          WHERE p.event_id = e.id AND p.status = 'pending'
        ) AS pending_uploads,
        (
          SELECT COUNT(*)
          FROM photos p
          WHERE p.event_id = e.id AND p.status = 'rejected'
        ) AS rejected_uploads,
        (
          SELECT COUNT(*)
          FROM photos p
          WHERE p.event_id = e.id
            AND p.created_at > NOW() - INTERVAL '24 hours'
        ) AS uploads_last_24h,
        (
          SELECT MAX(p.created_at)
          FROM photos p
          WHERE p.event_id = e.id
        ) AS last_upload_at,
        (
          SELECT ROUND(EXTRACT(EPOCH FROM AVG(p.approved_at - p.created_at)))::text
          FROM photos p
          WHERE p.event_id = e.id
            AND p.approved_at IS NOT NULL
        ) AS avg_processing_lag_seconds,
        (
          SELECT COALESCE(SUM(
            COALESCE((p.reactions->>'heart')::int, 0) +
            COALESCE((p.reactions->>'clap')::int, 0) +
            COALESCE((p.reactions->>'laugh')::int, 0) +
            COALESCE((p.reactions->>'wow')::int, 0)
          ), 0)
          FROM photos p
          WHERE p.event_id = e.id
        ) AS total_reactions,
        ${getAdminEventDetailAttendanceSql(compatibility)}
        ${getAdminEventLuckyDrawSql(compatibility)}
        ${getAdminEventPhotoChallengeSql(compatibility)}
        ${getAdminEventPhotoScanSql(compatibility)}
        ${getAdminEventModerationLastActivitySql(compatibility)}
      FROM events e
      LEFT JOIN tenants t ON t.id = e.tenant_id
      LEFT JOIN users organizer ON organizer.id = e.organizer_id
      WHERE e.id = $1
    `,
    [eventId]
  );

  const row = eventResult.rows[0];
  if (!row) {
    return null;
  }

  let recentModerationRows: Array<{
    id: string;
    action: string;
    source: string;
    photo_status: string | null;
    reason: string | null;
    created_at: Date;
    moderator_name: string | null;
    moderator_email: string | null;
  }> = [];

  if (compatibility.includeModerationLogs) {
    try {
      const recentModerationResult = await db.query<{
        id: string;
        action: string;
        source: string;
        photo_status: string | null;
        reason: string | null;
        created_at: Date;
        moderator_name: string | null;
        moderator_email: string | null;
      }>(
        `
          SELECT
            pml.id,
            pml.action,
            pml.source,
            pml.photo_status,
            pml.reason,
            pml.created_at,
            u.name AS moderator_name,
            u.email AS moderator_email
          FROM photo_moderation_logs pml
          LEFT JOIN users u ON u.id = pml.moderator_id
          WHERE pml.event_id = $1
          ORDER BY pml.created_at DESC
          LIMIT 6
        `,
        [eventId]
      );

      recentModerationRows = recentModerationResult.rows;
    } catch (error) {
      if (!isMissingSchemaResourceError(error)) {
        throw error;
      }
    }
  }

  let recentAuditRows: Array<{
    id: string;
    action: string;
    reason: string | null;
    created_at: Date;
    admin_name: string | null;
    admin_email: string | null;
  }> = [];

  try {
    const recentAuditResult = await db.query<{
      id: string;
      action: string;
      reason: string | null;
      created_at: Date;
      admin_name: string | null;
      admin_email: string | null;
    }>(
      `
        SELECT
          a.id,
          a.action,
          a.reason,
          a.created_at,
          u.name AS admin_name,
          u.email AS admin_email
        FROM admin_audit_logs a
        LEFT JOIN users u ON u.id = a.admin_id
        WHERE a.target_type = 'event'
          AND a.target_id = $1
        ORDER BY a.created_at DESC
        LIMIT 8
      `,
      [eventId]
    );

    recentAuditRows = recentAuditResult.rows;
  } catch (error) {
    if (!isMissingSchemaResourceError(error)) {
      throw error;
    }
  }

  const topContributorsResult = await db.query<{
    id: string;
    name: string;
    email: string | null;
    photo_count: string;
  }>(
    `
      SELECT
        MIN(p.id)::text AS id,
        p.contributor_name AS name,
        NULL::text AS email,
        COUNT(*) AS photo_count
      FROM photos p
      WHERE p.event_id = $1
        AND p.contributor_name IS NOT NULL
        AND TRIM(p.contributor_name) <> ''
        AND COALESCE(p.is_anonymous, false) = false
      GROUP BY p.contributor_name
      ORDER BY photo_count DESC, p.contributor_name ASC
      LIMIT 8
    `,
    [eventId]
  );

  const event: AdminEventSummary = {
    id: row.id,
    tenant_id: row.tenant_id,
    tenant_name: row.tenant_name,
    tenant_slug: row.tenant_slug,
    name: row.name,
    short_code: row.short_code,
    status: row.status,
    event_date: toIsoString(row.event_date),
    expires_at: toIsoString(row.expires_at),
    created_at: row.created_at.toISOString(),
    photo_count: toNumber(row.total_uploads),
    guest_count: toNumber(row.total_guests),
    attendance_count: toNumber(row.total_checkins),
    description: row.description,
    location: row.location,
    qr_code_url: row.qr_code_url,
    updated_at: row.updated_at.toISOString(),
    organizer_id: row.organizer_id,
    organizer_name: row.organizer_name,
    organizer_email: row.organizer_email,
    tenant_tier: row.tenant_tier,
    settings: row.settings,
  };

  const uploadHealth: AdminEventUploadHealth = {
    total_uploads: toNumber(row.total_uploads),
    approved_uploads: toNumber(row.approved_uploads),
    pending_uploads: toNumber(row.pending_uploads),
    rejected_uploads: toNumber(row.rejected_uploads),
    uploads_last_24h: toNumber(row.uploads_last_24h),
    last_upload_at: toIsoString(row.last_upload_at),
    avg_processing_lag_seconds:
      row.avg_processing_lag_seconds === null ? null : toNumber(row.avg_processing_lag_seconds),
  };

  const galleryState: AdminEventGalleryState = {
    total_reactions: toNumber(row.total_reactions),
  };

  const attendance: AdminEventAttendanceSummary = {
    total_checkins: toNumber(row.total_checkins),
    unique_attendees: toNumber(row.unique_attendees),
    total_guests: toNumber(row.total_guests),
    last_checkin_at: toIsoString(row.last_checkin_at),
  };

  const luckyDraw: AdminEventLuckyDrawSummary = {
    enabled: Boolean(row.lucky_draw_enabled),
    status: row.lucky_draw_status,
    total_entries: toNumber(row.lucky_draw_entries),
    total_winners: toNumber(row.lucky_draw_winners),
    last_draw_at: toIsoString(row.last_draw_at),
  };

  const photoChallenge: AdminEventPhotoChallengeSummary = {
    enabled: Boolean(row.challenge_enabled),
    goal_photos: row.challenge_goal_photos,
    participant_count: toNumber(row.challenge_participants),
    goal_reached_count: toNumber(row.challenge_goal_reached_count),
    claimed_count: toNumber(row.challenge_claimed_count),
  };

  const moderation: AdminEventModerationSummary = {
    pending_photos: toNumber(row.pending_uploads),
    rejected_photos: toNumber(row.rejected_uploads),
    review_scans: toNumber(row.review_scans),
    rejected_scans: toNumber(row.rejected_scans),
    last_moderated_at: toIsoString(row.last_moderated_at),
  };

  const topContributors: AdminEventContributorSummary[] = topContributorsResult.rows.map((contributor) => ({
    id: contributor.id,
    name: contributor.name,
    email: contributor.email,
    photo_count: toNumber(contributor.photo_count),
  }));

  const recentModeration: AdminEventModerationLogItem[] = recentModerationRows.map((item) => ({
    id: item.id,
    action: item.action,
    source: item.source,
    photo_status: item.photo_status,
    reason: item.reason,
    created_at: item.created_at.toISOString(),
    moderator_name: item.moderator_name,
    moderator_email: item.moderator_email,
  }));

  const recentAudit: AdminAuditTimelineItem[] = recentAuditRows.map((item) => ({
    id: item.id,
    action: item.action,
    reason: item.reason,
    created_at: item.created_at.toISOString(),
    admin_name: item.admin_name,
    admin_email: item.admin_email,
  }));

  return {
    event,
    uploadHealth,
    galleryState,
    attendance,
    luckyDraw,
    photoChallenge,
    moderation,
    topContributors,
    recentModeration,
    recentAudit,
  };
}

export async function getAdminEventDetail(eventId: string): Promise<AdminEventDetailData | null> {
  try {
    return await getAdminEventDetailWithCompatibility(
      eventId,
      FULL_ADMIN_EVENT_DETAIL_COMPATIBILITY
    );
  } catch (error) {
    if (isMissingSchemaResourceError(error)) {
      return getAdminEventDetailWithCompatibility(
        eventId,
        LEGACY_ADMIN_EVENT_DETAIL_COMPATIBILITY
      );
    }

    throw error;
  }
}

export async function getAdminEventActionState(
  eventId: string
): Promise<AdminEventActionState | null> {
  const db = getAdminDb();
  const result = await db.query<{
    id: string;
    name: string;
    status: string;
    settings: Record<string, unknown> | null;
  }>(
    `
      SELECT
        id,
        name,
        status,
        settings
      FROM events
      WHERE id = $1
      LIMIT 1
    `,
    [eventId]
  );

  const row = result.rows[0];
  if (!row || !isAdminEventStatus(row.status)) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    settings: row.settings,
  };
}

export async function updateAdminEventStatus(eventId: string, status: AdminEventStatus) {
  const db = getAdminDb();
  const result = await db.query<{
    id: string;
    status: string;
    updated_at: Date;
  }>(
    `
      UPDATE events
      SET status = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, status, updated_at
    `,
    [eventId, status]
  );

  const row = result.rows[0];
  if (!row || !isAdminEventStatus(row.status)) {
    return null;
  }

  return {
    id: row.id,
    status: row.status,
    updated_at: row.updated_at.toISOString(),
  };
}

export async function updateAdminEventUploadAvailability(eventId: string, enabled: boolean) {
  const currentEvent = await getAdminEventActionState(eventId);
  if (!currentEvent) {
    return null;
  }

  const settings = cloneEventSettings(currentEvent.settings);
  const features = cloneEventFeatures(settings);
  features['photo_upload_enabled'] = enabled;
  settings['features'] = features;

  const db = getAdminDb();
  const result = await db.query<{
    id: string;
    settings: Record<string, unknown> | null;
    updated_at: Date;
  }>(
    `
      UPDATE events
      SET settings = $2::jsonb,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, settings, updated_at
    `,
    [eventId, JSON.stringify(settings)]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    settings: row.settings,
    uploads_enabled: isAdminEventUploadsEnabled(row.settings),
    updated_at: row.updated_at.toISOString(),
  };
}
