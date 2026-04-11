// ============================================
// Galeria - Event Stats API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/db';
import { getEffectiveTenantEntitlements, getTierConfig, normalizeSubscriptionTier } from '@/lib/tenant';
import type { SubscriptionTier } from '@/lib/types';
import { resolveOptionalAuth, resolveTenantId } from '@/lib/api-request-context';
import {
  buildEventPhotoLimitSummary,
  normalizeConfiguredEventPhotoLimit,
} from '@/lib/domain/events/event-stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface EventStats {
  totalPhotos: number;
  totalParticipants: number;
  photosToday: number;
  avgPhotosPerUser: number;
  topContributors: { name: string; count: number }[];
  uploadTimeline: { date: string; count: number }[];
  totalReactions: number;
  pendingModeration: number;
  luckyDrawStatus: 'active' | 'not_set';
  luckyDrawEntryCount: number;
  tierMaxPhotosPerEvent: number;
  tenantMaxPhotosPerEvent: number;
  configuredMaxPhotosPerEvent: number;
  effectiveMaxPhotosPerEvent: number;
  remainingPhotosInEvent: number;
  tierDisplayName: string;
  topLikedPhotos: {
    id: string;
    imageUrl: string;
    heartCount: number;
    contributorName: string;
    isAnonymous: boolean;
  }[];
}

function buildEmptyStats(
  tierMaxPhotosPerEvent = 0,
  tenantMaxPhotosPerEvent = 0,
  tierDisplayName = 'Free',
  configuredMaxPhotosPerEvent = 0,
  effectiveMaxPhotosPerEvent = 0
): EventStats {
  return {
    totalPhotos: 0,
    totalParticipants: 0,
    photosToday: 0,
    avgPhotosPerUser: 0,
    topContributors: [],
    uploadTimeline: [],
    totalReactions: 0,
    pendingModeration: 0,
    luckyDrawStatus: 'not_set',
    luckyDrawEntryCount: 0,
    tierMaxPhotosPerEvent,
    tenantMaxPhotosPerEvent,
    configuredMaxPhotosPerEvent,
    effectiveMaxPhotosPerEvent,
    remainingPhotosInEvent: effectiveMaxPhotosPerEvent < 0 ? -1 : effectiveMaxPhotosPerEvent,
    tierDisplayName,
    topLikedPhotos: [],
  };
}

interface CombinedStatsRow {
  total_photos: string | number;
  total_participants: string | number;
  photos_today: string | number;
  total_reactions: string | number;
  pending_moderation: string | number;
  top_contributors: unknown;
  upload_timeline: unknown;
  top_liked_photos: unknown;
}

interface EventAccessRow {
  organizer_id: string;
  tenant_id: string;
  subscription_tier: SubscriptionTier | null;
  settings: unknown;
}

interface LuckyDrawRow {
  total_entries: string | number | null;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeTopContributors(value: unknown): { name: string; count: number }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const row = (item || {}) as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name : 'Guest';
    return {
      name,
      count: toNumber(row.count),
    };
  });
}

function normalizeUploadTimeline(value: unknown): { date: string; count: number }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const row = (item || {}) as Record<string, unknown>;
    const dateRaw = row.date;
    const date = typeof dateRaw === 'string' || dateRaw instanceof Date
      ? getTimelineDate(dateRaw)
      : new Date().toISOString().split('T')[0];
    return {
      date,
      count: toNumber(row.count),
    };
  });
}

function normalizeTopLikedPhotos(value: unknown): EventStats['topLikedPhotos'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const row = (item || {}) as Record<string, unknown>;
    return {
      id: typeof row.id === 'string' ? row.id : '',
      imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : '',
      heartCount: toNumber(row.heartCount),
      contributorName: typeof row.contributorName === 'string' ? row.contributorName : 'Guest',
      isAnonymous: row.isAnonymous === true,
    };
  });
}

function getTimelineDate(value: string | Date): string {
  return new Date(value).toISOString().split('T')[0];
}

function areReactionsEnabled(settings: unknown): boolean {
  if (!settings || typeof settings !== 'object') {
    return true;
  }

  const features = (settings as { features?: { reactions_enabled?: boolean } }).features;
  return features?.reactions_enabled !== false;
}

// ============================================
// GET /api/events/:id/stats - Get event statistics
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId: id } = await params;
  const cacheHeaders = {
    'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
    Vary: 'Cookie',
  };

  try {
    const headers = request.headers;
    const auth = await resolveOptionalAuth(headers);
    const tenantId = resolveTenantId(headers, auth);

    // Keep stats publicly safe by returning empty stats when unauthenticated.
    if (!auth?.userId) {
      return NextResponse.json({ data: buildEmptyStats() }, { headers: cacheHeaders });
    }

    const db = getTenantDb(tenantId);
    const accessResult = await db.query<EventAccessRow>(
      `
        SELECT
          e.organizer_id,
          e.tenant_id,
          t.subscription_tier,
          e.settings
        FROM events e
        LEFT JOIN tenants t ON t.id = e.tenant_id
        WHERE e.id = $1
        LIMIT 1
      `,
      [id]
    );
    const access = accessResult.rows[0];

    if (!access) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const isOwner = access.organizer_id === auth.userId;
    const isSuperAdmin = auth.role === 'super_admin';
    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const effectiveTenantId = access.tenant_id || tenantId;

    const entitlements = await getEffectiveTenantEntitlements(
      effectiveTenantId,
      ((access.subscription_tier as SubscriptionTier) || 'free')
    );
    const normalizedTier = normalizeSubscriptionTier(access.subscription_tier || 'free');
    const tierDefaults = getTierConfig(normalizedTier);
    const configuredMaxPhotosPerEvent = normalizeConfiguredEventPhotoLimit(access.settings);
    const photoLimitSummary = buildEventPhotoLimitSummary({
      tierMaxPhotosPerEvent: tierDefaults.limits.max_photos_per_event,
      tenantMaxPhotosPerEvent: entitlements.limits.max_photos_per_event,
      configuredMaxPhotosPerEvent,
      totalPhotos: 0,
    });
    const stats = buildEmptyStats(
      photoLimitSummary.tierMaxPhotosPerEvent,
      photoLimitSummary.tenantMaxPhotosPerEvent,
      entitlements.displayName,
      photoLimitSummary.configuredMaxPhotosPerEvent,
      photoLimitSummary.effectiveMaxPhotosPerEvent
    );
    const warnings: string[] = [];

    const combinedResult = await db.query<CombinedStatsRow>(
      `
        WITH base_photos AS (
          SELECT
            id,
            user_fingerprint,
            created_at,
            status,
            contributor_name,
            is_anonymous,
            reactions,
            images
          FROM photos
          WHERE event_id = $1
        ),
        photo_totals AS (
          SELECT
            COUNT(*) AS total_photos,
            COUNT(DISTINCT user_fingerprint) AS total_participants,
            COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now())) AS photos_today,
            COALESCE(
              SUM(
                COALESCE((reactions->>'heart')::int, 0) +
                COALESCE((reactions->>'clap')::int, 0) +
                COALESCE((reactions->>'laugh')::int, 0) +
                COALESCE((reactions->>'wow')::int, 0)
              ),
              0
            ) AS total_reactions,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending_moderation
          FROM base_photos
        ),
        top_contributors AS (
          SELECT
            CASE
              WHEN is_anonymous THEN 'Anonymous'
              ELSE COALESCE(contributor_name, 'Guest')
            END AS name,
            COUNT(*) AS count
          FROM base_photos
          GROUP BY contributor_name, is_anonymous
          ORDER BY COUNT(*) DESC
          LIMIT 3
        ),
        upload_timeline AS (
          SELECT
            DATE(created_at) AS date,
            COUNT(*) AS count
          FROM base_photos
          WHERE created_at >= now() - INTERVAL '7 days'
          GROUP BY DATE(created_at)
          ORDER BY date
        ),
        top_liked AS (
          SELECT
            id,
            COALESCE(images->>'medium_url', images->>'full_url', images->>'original_url', images->>'thumbnail_url', '') AS "imageUrl",
            COALESCE((reactions->>'heart')::int, 0) AS "heartCount",
            CASE
              WHEN is_anonymous THEN 'Anonymous'
              ELSE COALESCE(contributor_name, 'Guest')
            END AS "contributorName",
            is_anonymous AS "isAnonymous"
          FROM base_photos
          ORDER BY COALESCE((reactions->>'heart')::int, 0) DESC, created_at DESC
          LIMIT 3
        )
        SELECT
          pt.total_photos,
          pt.total_participants,
          pt.photos_today,
          pt.total_reactions,
          pt.pending_moderation,
          COALESCE((SELECT json_agg(tc ORDER BY tc.count DESC) FROM top_contributors tc), '[]'::json) AS top_contributors,
          COALESCE((SELECT json_agg(ut ORDER BY ut.date) FROM upload_timeline ut), '[]'::json) AS upload_timeline,
          COALESCE((SELECT json_agg(tl) FROM top_liked tl), '[]'::json) AS top_liked_photos
        FROM photo_totals pt
      `,
      [id]
    );

    const combined = combinedResult.rows[0];

    stats.totalPhotos = toNumber(combined?.total_photos);
    stats.remainingPhotosInEvent = buildEventPhotoLimitSummary({
      tierMaxPhotosPerEvent: stats.tierMaxPhotosPerEvent,
      tenantMaxPhotosPerEvent: stats.tenantMaxPhotosPerEvent,
      configuredMaxPhotosPerEvent: stats.configuredMaxPhotosPerEvent,
      totalPhotos: stats.totalPhotos,
    }).remainingPhotosInEvent;
    stats.totalParticipants = toNumber(combined?.total_participants);
    stats.photosToday = toNumber(combined?.photos_today);
    stats.totalReactions = toNumber(combined?.total_reactions);
    stats.pendingModeration = toNumber(combined?.pending_moderation);
    stats.topContributors = normalizeTopContributors(combined?.top_contributors);
    stats.topLikedPhotos = normalizeTopLikedPhotos(combined?.top_liked_photos);

    const timelineMap = new Map(
      normalizeUploadTimeline(combined?.upload_timeline).map((row) => [row.date, row.count])
    );
    const uploadTimeline: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      uploadTimeline.push({ date: dateStr, count: timelineMap.get(dateStr) || 0 });
    }
    stats.uploadTimeline = uploadTimeline;

    if (stats.totalParticipants > 0) {
      stats.avgPhotosPerUser = Math.round((stats.totalPhotos / stats.totalParticipants) * 10) / 10;
    }

    const reactionsEnabled = areReactionsEnabled(access.settings);
    if (!reactionsEnabled) {
      stats.totalReactions = 0;
      stats.topLikedPhotos = [];
    }

    if (!entitlements.features.advanced_analytics) {
      stats.topContributors = [];
      stats.topLikedPhotos = [];
    }

    try {
      const luckyDrawResult = await db.query<LuckyDrawRow>(
        `
          SELECT total_entries
          FROM lucky_draw_configs
          WHERE event_id = $1
            AND status = 'scheduled'
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [id]
      );
      const activeConfig = luckyDrawResult.rows[0];
      if (activeConfig) {
        stats.luckyDrawStatus = 'active';
        stats.luckyDrawEntryCount = toNumber(activeConfig.total_entries);
      }
    } catch {
      warnings.push('Lucky draw stats unavailable.');
    }

    if (!entitlements.features.lucky_draw) {
      stats.luckyDrawStatus = 'not_set';
      stats.luckyDrawEntryCount = 0;
    }

    return NextResponse.json({
      data: stats,
      warnings: warnings.length > 0 ? warnings : undefined,
    }, { headers: cacheHeaders });
  } catch (error) {
    console.error('[API] Error fetching event stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event stats', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

