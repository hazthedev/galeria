import 'server-only';

import {
  EMPTY_ADMIN_OVERVIEW_STATS,
  type AdminActivityItem,
  type AdminOverviewData,
  type AdminOverviewStats,
} from '@/lib/domain/admin/types';
import { getAdminDb, isMissingTableError } from '@/lib/domain/admin/context';
import { hydrateModeratorImagePreviewUrls } from '@/lib/moderation/presentation';

type QueryRows<T> = {
  rows: T[];
};

const toIsoString = (value: Date | string) => {
  if (typeof value === 'string') {
    return new Date(value).toISOString();
  }

  return value.toISOString();
};

async function safeQuery<T extends Record<string, unknown>>(
  query: string,
  params: unknown[] = []
): Promise<QueryRows<T>> {
  const db = getAdminDb();

  try {
    return await db.query<T>(query, params);
  } catch (error) {
    if (isMissingTableError(error)) {
      return { rows: [] };
    }

    throw error;
  }
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const db = getAdminDb();
  const result = await db.query<{
    totalUsers: string;
    totalEvents: string;
    totalPhotos: string;
    totalTenants: string;
    activeEvents: string;
    recentUsers: string;
    totalLuckyDraws: string;
    totalWinners: string;
    pendingPhotos: string;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM users) AS "totalUsers",
      (SELECT COUNT(*) FROM events) AS "totalEvents",
      (SELECT COUNT(*) FROM photos) AS "totalPhotos",
      (SELECT COUNT(*) FROM tenants) AS "totalTenants",
      (SELECT COUNT(*) FROM events WHERE status = 'active') AS "activeEvents",
      (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS "recentUsers",
      (SELECT COUNT(*) FROM lucky_draw_configs) AS "totalLuckyDraws",
      (SELECT COUNT(*) FROM winners) AS "totalWinners",
      (SELECT COUNT(*) FROM photos WHERE status = 'pending') AS "pendingPhotos"
  `);

  const row = result.rows[0];
  let mfaEnabledUsers = 0;

  try {
    const mfaResult = await db.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM users WHERE totp_enabled = true'
    );
    mfaEnabledUsers = Number(mfaResult.rows[0]?.count || 0);
  } catch {
    mfaEnabledUsers = 0;
  }

  return {
    totalUsers: Number(row?.totalUsers || 0),
    totalEvents: Number(row?.totalEvents || 0),
    totalPhotos: Number(row?.totalPhotos || 0),
    totalTenants: Number(row?.totalTenants || 0),
    activeEvents: Number(row?.activeEvents || 0),
    recentUsers: Number(row?.recentUsers || 0),
    mfaEnabledUsers,
    totalLuckyDraws: Number(row?.totalLuckyDraws || 0),
    totalWinners: Number(row?.totalWinners || 0),
    pendingPhotos: Number(row?.pendingPhotos || 0),
  };
}

export async function getAdminRecentActivity(limit: number = 12): Promise<AdminActivityItem[]> {
  const perTableLimit = Math.min(limit * 2, 50);

  const usersResult = await safeQuery<{
    id: string;
    createdAt: Date;
    userName: string | null;
    userEmail: string;
    tenantName: string | null;
  }>(
    `
      SELECT
        u.id,
        u.created_at AS "createdAt",
        u.name AS "userName",
        u.email AS "userEmail",
        t.company_name AS "tenantName"
      FROM users u
      JOIN tenants t ON t.id = u.tenant_id
      ORDER BY u.created_at DESC
      LIMIT $1
    `,
    [perTableLimit]
  );

  const eventsResult = await safeQuery<{
    id: string;
    createdAt: Date;
    eventName: string;
    eventStatus: string;
    organizerName: string | null;
    tenantName: string | null;
  }>(
    `
      SELECT
        e.id,
        e.created_at AS "createdAt",
        e.name AS "eventName",
        e.status AS "eventStatus",
        u.name AS "organizerName",
        t.company_name AS "tenantName"
      FROM events e
      JOIN users u ON u.id = e.organizer_id
      JOIN tenants t ON t.id = e.tenant_id
      ORDER BY e.created_at DESC
      LIMIT $1
    `,
    [perTableLimit]
  );

  const photosResult = await safeQuery<{
    id: string;
    photoId: string;
    createdAt: Date;
    contributorName: string | null;
    photoStatus: string | null;
    eventId: string;
    eventName: string;
    tenantName: string | null;
    imageUrl: string | null;
  }>(
    `
      SELECT
        p.id,
        p.id AS "photoId",
        p.created_at AS "createdAt",
        p.contributor_name AS "contributorName",
        p.status AS "photoStatus",
        e.id AS "eventId",
        e.name AS "eventName",
        t.company_name AS "tenantName",
        (p.images ->> 'thumbnail_url') AS "imageUrl"
      FROM photos p
      JOIN events e ON e.id = p.event_id
      JOIN tenants t ON t.id = e.tenant_id
      ORDER BY p.created_at DESC
      LIMIT $1
    `,
    [perTableLimit]
  );

  const moderationResult = await safeQuery<{
    id: string;
    photoId: string | null;
    createdAt: Date;
    action: string;
    reason: string | null;
    moderatorName: string | null;
    moderatorEmail: string | null;
    eventId: string;
    eventName: string;
    tenantName: string | null;
    imageUrl: string | null;
    photoStatus: string | null;
  }>(
    `
      SELECT
        l.id,
        l.photo_id AS "photoId",
        l.created_at AS "createdAt",
        l.action,
        l.reason,
        u.name AS "moderatorName",
        u.email AS "moderatorEmail",
        e.id AS "eventId",
        e.name AS "eventName",
        t.company_name AS "tenantName",
        COALESCE((p.images ->> 'thumbnail_url'), l.image_url) AS "imageUrl",
        COALESCE(p.status::text, l.photo_status) AS "photoStatus"
      FROM photo_moderation_logs l
      LEFT JOIN users u ON u.id = l.moderator_id
      JOIN events e ON e.id = l.event_id
      JOIN tenants t ON t.id = l.tenant_id
      LEFT JOIN photos p ON p.id = l.photo_id
      ORDER BY l.created_at DESC
      LIMIT $1
    `,
    [perTableLimit]
  );

  const [hydratedPhotoRows, hydratedModerationRows] = await Promise.all([
    hydrateModeratorImagePreviewUrls(photosResult.rows),
    hydrateModeratorImagePreviewUrls(moderationResult.rows),
  ]);

  const activityItems: AdminActivityItem[] = [
    ...usersResult.rows.map((row) => ({
      id: row.id,
      type: 'user' as const,
      createdAt: toIsoString(row.createdAt),
      tenantName: row.tenantName,
      userName: row.userName,
      userEmail: row.userEmail,
    })),
    ...eventsResult.rows.map((row) => ({
      id: row.id,
      type: 'event' as const,
      createdAt: toIsoString(row.createdAt),
      tenantName: row.tenantName,
      eventName: row.eventName,
      eventStatus: row.eventStatus,
      organizerName: row.organizerName,
    })),
    ...hydratedPhotoRows.map((row) => ({
      id: row.id,
      type: 'photo' as const,
      createdAt: toIsoString(row.createdAt),
      tenantName: row.tenantName,
      eventId: row.eventId,
      eventName: row.eventName,
      contributorName: row.contributorName,
      photoStatus: row.photoStatus,
      imageUrl: row.imageUrl,
    })),
    ...hydratedModerationRows.map((row) => ({
      id: row.id,
      type: 'moderation' as const,
      createdAt: toIsoString(row.createdAt),
      tenantName: row.tenantName,
      eventId: row.eventId,
      eventName: row.eventName,
      moderatorName: row.moderatorName,
      moderatorEmail: row.moderatorEmail,
      action: row.action,
      reason: row.reason,
      imageUrl: row.imageUrl,
      photoStatus: row.photoStatus,
    })),
  ];

  return activityItems
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function getAdminOverview(activityLimit: number = 10): Promise<AdminOverviewData> {
  const stats = await getAdminOverviewStats();
  const recentActivity = await getAdminRecentActivity(activityLimit);

  return {
    stats,
    recentActivity,
  };
}

export function getEmptyAdminOverviewData(): AdminOverviewData {
  return {
    stats: EMPTY_ADMIN_OVERVIEW_STATS,
    recentActivity: [],
  };
}
