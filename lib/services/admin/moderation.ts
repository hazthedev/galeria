import 'server-only';

import { getAdminDb } from '@/lib/domain/admin/context';
import type { AdminModerationQueueItem } from '@/lib/domain/admin/types';
import {
  approvePhotoManually,
  deletePhotoManually,
  rejectPhotoManually,
  type ModerationServiceResult,
} from '@/lib/moderation/service';
import {
  hydrateModeratorImagePreviewUrls,
  type PreviewableImageRecord,
} from '@/lib/moderation/presentation';

export interface ListAdminModerationQueueOptions {
  page: number;
  limit: number;
  status?: string | null;
  source?: string | null;
  search?: string | null;
}

export interface AdminModerationPhotoState {
  photo_id: string;
  tenant_id: string;
  event_id: string;
  event_name: string;
  photo_status: string;
  contributor_name: string | null;
}

export type AdminModerationAction = 'approve_photo' | 'reject_photo' | 'delete_photo';

interface ModerationQueueHydrationRow extends PreviewableImageRecord {
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
  latest_scan_at: Date | string | null;
  latest_moderation_action: string | null;
  latest_moderation_source: string | null;
  latest_moderation_reason: string | null;
  latest_moderation_at: Date | string | null;
  created_at: Date;
}

function toIsoString(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return new Date(value).toISOString();
  }

  return value.toISOString();
}

const isMissingRelationError = (error: unknown) =>
  (error as { code?: string })?.code === '42P01';

async function tableExists(name: string): Promise<boolean> {
  const db = getAdminDb();
  const result = await db.query<{ name: string | null }>(
    'SELECT to_regclass($1) AS name',
    [name]
  );

  return Boolean(result.rows[0]?.name);
}

export async function listAdminModerationQueue(options: ListAdminModerationQueueOptions) {
  const db = getAdminDb();
  const offset = (options.page - 1) * options.limit;
  const hasScanLogs = await tableExists('public.photo_scan_logs');
  const hasModerationLogs = await tableExists('public.photo_moderation_logs');

  let whereClause = `p.status IN ('pending', 'rejected')`;
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options.status && options.status !== 'all') {
    whereClause += ` AND p.status = $${paramIndex++}`;
    params.push(options.status);
  }

  if (options.search) {
    whereClause += `
      AND (
        e.name ILIKE $${paramIndex}
        OR t.company_name ILIKE $${paramIndex + 1}
        OR COALESCE(p.contributor_name, '') ILIKE $${paramIndex + 2}
        OR COALESCE(e.short_code, '') ILIKE $${paramIndex + 3}
      )
    `;
    params.push(
      `%${options.search}%`,
      `%${options.search}%`,
      `%${options.search}%`,
      `%${options.search}%`
    );
    paramIndex += 4;
  }

  const scanJoin = hasScanLogs
    ? `
      LEFT JOIN LATERAL (
        SELECT
          l.decision,
          l.outcome,
          l.reason,
          l.created_at
        FROM photo_scan_logs l
        WHERE l.photo_id = p.id
        ORDER BY l.created_at DESC
        LIMIT 1
      ) scan ON true
    `
    : `
      LEFT JOIN LATERAL (
        SELECT
          NULL::text AS decision,
          NULL::text AS outcome,
          NULL::text AS reason,
          NULL::timestamp AS created_at
      ) scan ON true
    `;

  const moderationJoin = hasModerationLogs
    ? `
      LEFT JOIN LATERAL (
        SELECT
          l.action,
          l.source,
          l.reason,
          l.created_at
        FROM photo_moderation_logs l
        WHERE l.photo_id = p.id
        ORDER BY l.created_at DESC
        LIMIT 1
      ) mod ON true
    `
    : `
      LEFT JOIN LATERAL (
        SELECT
          NULL::text AS action,
          NULL::text AS source,
          NULL::text AS reason,
          NULL::timestamp AS created_at
      ) mod ON true
    `;

  if (options.source && options.source !== 'all') {
    if (options.source === 'ai') {
      whereClause += hasScanLogs
        ? ` AND scan.decision IS NOT NULL`
        : ` AND false`;
    } else if (options.source === 'manual') {
      whereClause += hasModerationLogs
        ? ` AND mod.action IS NOT NULL`
        : ` AND false`;
    }
  }

  const selectParams = [...params, options.limit, offset];
  const result = await db
    .query<{
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
      latest_scan_at: Date | string | null;
      latest_moderation_action: string | null;
      latest_moderation_source: string | null;
      latest_moderation_reason: string | null;
      latest_moderation_at: Date | string | null;
      created_at: Date;
    }>(
      `
        SELECT
          p.id AS photo_id,
          e.tenant_id,
          t.company_name AS tenant_name,
          e.id AS event_id,
          e.name AS event_name,
          e.short_code AS event_short_code,
          p.contributor_name,
          p.status AS photo_status,
          COALESCE(
            p.images ->> 'thumbnail_url',
            p.images ->> 'medium_url',
            p.images ->> 'original_url'
          ) AS image_url,
          scan.decision AS latest_scan_decision,
          scan.outcome AS latest_scan_outcome,
          scan.reason AS latest_scan_reason,
          scan.created_at AS latest_scan_at,
          mod.action AS latest_moderation_action,
          mod.source AS latest_moderation_source,
          mod.reason AS latest_moderation_reason,
          mod.created_at AS latest_moderation_at,
          p.created_at
        FROM photos p
        INNER JOIN events e ON e.id = p.event_id
        LEFT JOIN tenants t ON t.id = e.tenant_id
        ${scanJoin}
        ${moderationJoin}
        WHERE ${whereClause}
        ORDER BY
          CASE WHEN p.status = 'pending' THEN 0 ELSE 1 END,
          COALESCE(scan.created_at, mod.created_at, p.created_at) DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      selectParams
    )
    .catch((error) => (isMissingRelationError(error) ? null : Promise.reject(error)));

  if (!result) {
    return {
      items: [] as AdminModerationQueueItem[],
      pagination: {
        page: options.page,
        limit: options.limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  const countResult = await db.query<{ count: string }>(
    `
      SELECT COUNT(*) AS count
      FROM photos p
      INNER JOIN events e ON e.id = p.event_id
      LEFT JOIN tenants t ON t.id = e.tenant_id
      ${scanJoin}
      ${moderationJoin}
      WHERE ${whereClause}
    `,
    params
  );

  const hydrated = await hydrateModeratorImagePreviewUrls<ModerationQueueHydrationRow>(
    result.rows.map((row) => ({
      ...row,
      photoId: row.photo_id,
      photoStatus: row.photo_status,
      imageUrl: row.image_url,
    }))
  );

  const items: AdminModerationQueueItem[] = hydrated.map((row) => ({
    photo_id: row.photo_id,
    tenant_id: row.tenant_id,
    tenant_name: row.tenant_name,
    event_id: row.event_id,
    event_name: row.event_name,
    event_short_code: row.event_short_code,
    contributor_name: row.contributor_name,
    photo_status: row.photo_status,
    image_url: row.imageUrl,
    latest_scan_decision: row.latest_scan_decision,
    latest_scan_outcome: row.latest_scan_outcome,
    latest_scan_reason: row.latest_scan_reason,
    latest_scan_at: toIsoString(row.latest_scan_at),
    latest_moderation_action: row.latest_moderation_action,
    latest_moderation_source: row.latest_moderation_source,
    latest_moderation_reason: row.latest_moderation_reason,
    latest_moderation_at: toIsoString(row.latest_moderation_at),
    created_at: row.created_at.toISOString(),
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

export async function getAdminModerationPhotoState(
  photoId: string
): Promise<AdminModerationPhotoState | null> {
  const db = getAdminDb();
  const result = await db.query<AdminModerationPhotoState>(
    `
      SELECT
        p.id AS photo_id,
        e.tenant_id,
        e.id AS event_id,
        e.name AS event_name,
        p.status AS photo_status,
        p.contributor_name
      FROM photos p
      INNER JOIN events e ON e.id = p.event_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [photoId]
  );

  return result.rows[0] || null;
}

export async function applyAdminModerationAction(input: {
  action: AdminModerationAction;
  photoId: string;
  tenantId: string;
  moderatorId: string;
  reason?: string;
}): Promise<ModerationServiceResult> {
  switch (input.action) {
    case 'approve_photo':
      return approvePhotoManually({
        tenantId: input.tenantId,
        photoId: input.photoId,
        moderatorId: input.moderatorId,
        reason: input.reason,
      });
    case 'reject_photo':
      return rejectPhotoManually({
        tenantId: input.tenantId,
        photoId: input.photoId,
        moderatorId: input.moderatorId,
        reason: input.reason,
      });
    case 'delete_photo':
      return deletePhotoManually({
        tenantId: input.tenantId,
        photoId: input.photoId,
        moderatorId: input.moderatorId,
        reason: input.reason,
      });
    default: {
      const exhaustiveCheck: never = input.action;
      throw new Error(`Unsupported moderation action: ${exhaustiveCheck}`);
    }
  }
}
