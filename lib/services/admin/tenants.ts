import 'server-only';

import crypto from 'crypto';

import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';
import { getAdminDb, isMissingSchemaResourceError } from '@/lib/domain/admin/context';
import type {
  AdminAuditTimelineItem,
  AdminSubscriptionTier,
  AdminTenantDetailData,
  AdminTenantEventSummary,
  AdminTenantListItem,
  AdminTenantStatus,
  AdminTenantSummary,
  AdminTenantUserSummary,
} from '@/lib/domain/admin/types';
import { getTierConfig } from '@/lib/tenant';
import type { SubscriptionTier } from '@/lib/types';

export interface AdminTenantRecord {
  id: string;
  company_name: string;
  slug: string;
  subscription_tier: SubscriptionTier;
  status: AdminTenantStatus;
}

export interface ListAdminTenantsOptions {
  page: number;
  limit: number;
  status?: string | null;
  tier?: string | null;
  search?: string | null;
}

interface AdminTenantCompatibilityOptions {
  includeSlug: boolean;
  includeAttendanceMetrics: boolean;
  includeTotpEnabled: boolean;
}

const FULL_ADMIN_TENANT_COMPATIBILITY: AdminTenantCompatibilityOptions = {
  includeSlug: true,
  includeAttendanceMetrics: true,
  includeTotpEnabled: true,
};

const LEGACY_ADMIN_TENANT_COMPATIBILITY: AdminTenantCompatibilityOptions = {
  includeSlug: false,
  includeAttendanceMetrics: false,
  includeTotpEnabled: false,
};

export function isSystemTenantId(tenantId: string): boolean {
  return tenantId === SYSTEM_TENANT_ID;
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

function getAdminTenantSlugSql(options: AdminTenantCompatibilityOptions): string {
  return options.includeSlug ? 't.slug,' : 'NULL::text AS slug,';
}

function getAdminTenantSearchClause(
  options: AdminTenantCompatibilityOptions,
  paramIndex: number
): string {
  if (options.includeSlug) {
    return ` AND (t.company_name ILIKE $${paramIndex} OR t.slug ILIKE $${paramIndex + 1})`;
  }

  return ` AND t.company_name ILIKE $${paramIndex}`;
}

function getAdminTenantGuestCountSql(options: AdminTenantCompatibilityOptions): string {
  if (options.includeAttendanceMetrics) {
    return `
        (
          SELECT COUNT(*)
          FROM attendances a
          WHERE a.event_id IN (SELECT id FROM events WHERE tenant_id = t.id)
        ) as guest_count,
    `;
  }

  return '0::bigint as guest_count,';
}

function getAdminTenantTotpSql(options: AdminTenantCompatibilityOptions): string {
  return options.includeTotpEnabled ? 'COALESCE(u.totp_enabled, false) AS totp_enabled' : 'false AS totp_enabled';
}

async function listAdminTenantsWithCompatibility(
  options: ListAdminTenantsOptions,
  compatibility: AdminTenantCompatibilityOptions
) {
  const db = getAdminDb();
  const offset = (options.page - 1) * options.limit;

  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options.status && options.status !== 'all') {
    whereClause += ` AND t.status = $${paramIndex++}`;
    params.push(options.status);
  }

  if (options.tier && options.tier !== 'all') {
    whereClause += ` AND t.subscription_tier = $${paramIndex++}`;
    params.push(options.tier);
  }

  if (options.search) {
    whereClause += getAdminTenantSearchClause(compatibility, paramIndex);
    params.push(`%${options.search}%`);
    paramIndex += 1;

    if (compatibility.includeSlug) {
      params.push(`%${options.search}%`);
      paramIndex += 1;
    }
  }

  const tenantsResult = await db.query<{
    id: string;
    company_name: string;
    slug: string | null;
    subscription_tier: AdminSubscriptionTier;
    status: AdminTenantStatus;
    created_at: Date;
    updated_at: Date;
    event_count: string;
    user_count: string;
    photo_count: string;
  }>(
    `
      SELECT
        t.id,
        t.company_name,
        ${getAdminTenantSlugSql(compatibility)}
        t.subscription_tier,
        t.status,
        t.created_at,
        t.updated_at,
        COUNT(DISTINCT e.id) FILTER (WHERE e.id IS NOT NULL) as event_count,
        COUNT(DISTINCT u.id) FILTER (WHERE u.id IS NOT NULL) as user_count,
        ${getAdminTenantGuestCountSql(compatibility)}
        (SELECT COUNT(*) FROM photos p WHERE p.event_id IN (SELECT id FROM events WHERE tenant_id = t.id)) as photo_count
      FROM tenants t
      LEFT JOIN events e ON e.tenant_id = t.id
      LEFT JOIN users u ON u.tenant_id = t.id
      WHERE ${whereClause}
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...params, options.limit, offset]
  );

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM tenants t WHERE ${whereClause}`,
    params.slice(0, paramIndex - 1)
  );

  const items: AdminTenantListItem[] = tenantsResult.rows.map((row) => ({
    id: row.id,
    company_name: row.company_name,
    slug: row.slug || row.id,
    subscription_tier: row.subscription_tier,
    status: row.status,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    event_count: Number(row.event_count || 0),
    user_count: Number(row.user_count || 0),
    photo_count: Number(row.photo_count || 0),
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

export async function listAdminTenants(options: ListAdminTenantsOptions) {
  try {
    return await listAdminTenantsWithCompatibility(options, FULL_ADMIN_TENANT_COMPATIBILITY);
  } catch (error) {
    if (isMissingSchemaResourceError(error)) {
      return listAdminTenantsWithCompatibility(options, LEGACY_ADMIN_TENANT_COMPATIBILITY);
    }

    throw error;
  }
}

export async function getAdminTenantById(tenantId: string): Promise<AdminTenantRecord | null> {
  const db = getAdminDb();
  return db.findOne<AdminTenantRecord>('tenants', { id: tenantId });
}

export async function getAdminTenantBySlug(slug: string): Promise<AdminTenantRecord | null> {
  const db = getAdminDb();
  return db.findOne<AdminTenantRecord>('tenants', { slug });
}

async function getAdminTenantDetailWithCompatibility(
  tenantId: string,
  compatibility: AdminTenantCompatibilityOptions
): Promise<AdminTenantDetailData | null> {
  const db = getAdminDb();

  const tenantResult = await db.query<{
    id: string;
    company_name: string;
    slug: string | null;
    subscription_tier: AdminSubscriptionTier;
    status: AdminTenantStatus;
    created_at: Date;
    updated_at: Date;
    brand_name: string | null;
    contact_email: string | null;
    support_email: string | null;
    domain: string | null;
    subdomain: string | null;
    features_enabled: Record<string, boolean> | null;
    limits: Record<string, unknown> | null;
    event_count: string;
    user_count: string;
    photo_count: string;
    active_events_count: string;
    organizer_count: string;
    guest_count: string;
    pending_photos_count: string;
  }>(
    `
      SELECT
        t.id,
        t.company_name,
        ${getAdminTenantSlugSql(compatibility)}
        t.subscription_tier,
        t.status,
        t.created_at,
        t.updated_at,
        t.brand_name,
        t.contact_email,
        t.support_email,
        t.domain,
        t.subdomain,
        t.features_enabled,
        t.limits,
        COUNT(DISTINCT e.id) FILTER (WHERE e.id IS NOT NULL) as event_count,
        COUNT(DISTINCT u.id) FILTER (WHERE u.id IS NOT NULL) as user_count,
        (
          SELECT COUNT(*)
          FROM photos p
          WHERE p.event_id IN (SELECT id FROM events WHERE tenant_id = t.id)
        ) as photo_count,
        (
          SELECT COUNT(*)
          FROM events
          WHERE tenant_id = $1 AND status = 'active'
        ) as active_events_count,
        (
          SELECT COUNT(*)
          FROM users
          WHERE tenant_id = $1 AND role = 'organizer'
        ) as organizer_count,
        ${getAdminTenantGuestCountSql(compatibility)}
        (
          SELECT COUNT(*)
          FROM photos p
          WHERE p.event_id IN (SELECT id FROM events WHERE tenant_id = t.id)
            AND p.status = 'pending'
        ) as pending_photos_count
      FROM tenants t
      LEFT JOIN events e ON e.tenant_id = t.id
      LEFT JOIN users u ON u.tenant_id = t.id
      WHERE t.id = $1
      GROUP BY t.id
    `,
    [tenantId]
  );

  const row = tenantResult.rows[0];
  if (!row) {
    return null;
  }

  const recentUsersResult = await db.query<{
    id: string;
    name: string | null;
    email: string;
    role: 'guest' | 'organizer' | 'super_admin';
    created_at: Date;
    last_login_at: Date | null;
    totp_enabled: boolean;
  }>(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        u.last_login_at,
        ${getAdminTenantTotpSql(compatibility)}
      FROM users u
      WHERE u.tenant_id = $1
      ORDER BY COALESCE(u.last_login_at, u.created_at) DESC
      LIMIT 6
    `,
    [tenantId]
  );

  const recentEventsResult = await db.query<{
    id: string;
    name: string;
    short_code: string | null;
    status: string;
    created_at: Date;
    event_date: Date | null;
    expires_at: Date | null;
    photo_count: string;
  }>(
    `
      SELECT
        e.id,
        e.name,
        e.short_code,
        e.status,
        e.created_at,
        e.event_date,
        e.expires_at,
        (
          SELECT COUNT(*)
          FROM photos p
          WHERE p.event_id = e.id
        ) AS photo_count
      FROM events e
      WHERE e.tenant_id = $1
      ORDER BY e.created_at DESC
      LIMIT 6
    `,
    [tenantId]
  );

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
        WHERE a.target_id = $1
           OR (
             a.target_type = 'tenant'
             AND (
               a.target_id = $1
               OR a.reason ILIKE $2
             )
           )
        ORDER BY a.created_at DESC
        LIMIT 8
      `,
      [tenantId, `%${row.company_name}%`]
    );

    recentAuditRows = recentAuditResult.rows;
  } catch (error) {
    if (!isMissingSchemaResourceError(error)) {
      throw error;
    }
  }

  const tenant: AdminTenantSummary = {
    id: row.id,
    company_name: row.company_name,
    slug: row.slug || row.id,
    subscription_tier: row.subscription_tier,
    status: row.status,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    event_count: Number(row.event_count || 0),
    user_count: Number(row.user_count || 0),
    photo_count: Number(row.photo_count || 0),
    brand_name: row.brand_name,
    contact_email: row.contact_email,
    support_email: row.support_email,
    domain: row.domain,
    subdomain: row.subdomain,
    features_enabled: row.features_enabled,
    limits: row.limits,
    active_events_count: Number(row.active_events_count || 0),
    organizer_count: Number(row.organizer_count || 0),
    guest_count: Number(row.guest_count || 0),
    pending_photos_count: Number(row.pending_photos_count || 0),
  };

  const recentUsers: AdminTenantUserSummary[] = recentUsersResult.rows.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at.toISOString(),
    last_login_at: toIsoString(user.last_login_at),
    totp_enabled: user.totp_enabled,
  }));

  const recentEvents: AdminTenantEventSummary[] = recentEventsResult.rows.map((event) => ({
    id: event.id,
    name: event.name,
    short_code: event.short_code,
    status: event.status,
    created_at: event.created_at.toISOString(),
    start_date: toIsoString(event.event_date),
    end_date: toIsoString(event.expires_at),
    photo_count: Number(event.photo_count || 0),
  }));

  const recentAudit: AdminAuditTimelineItem[] = recentAuditRows.map((audit) => ({
    id: audit.id,
    action: audit.action,
    reason: audit.reason,
    created_at: audit.created_at.toISOString(),
    admin_name: audit.admin_name,
    admin_email: audit.admin_email,
  }));

  return {
    tenant,
    recentUsers,
    recentEvents,
    recentAudit,
  };
}

export async function getAdminTenantDetail(tenantId: string): Promise<AdminTenantDetailData | null> {
  try {
    return await getAdminTenantDetailWithCompatibility(tenantId, FULL_ADMIN_TENANT_COMPATIBILITY);
  } catch (error) {
    if (isMissingSchemaResourceError(error)) {
      return getAdminTenantDetailWithCompatibility(tenantId, LEGACY_ADMIN_TENANT_COMPATIBILITY);
    }

    throw error;
  }
}

export async function updateAdminTenantStatus(
  tenantId: string,
  status: AdminTenantStatus
): Promise<AdminTenantRecord> {
  const db = getAdminDb();
  const result = await db.query<AdminTenantRecord>(
    `
      UPDATE tenants
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, company_name, slug, subscription_tier, status
    `,
    [status, tenantId]
  );

  return result.rows[0];
}

export async function updateAdminTenantSubscriptionTier(
  tenantId: string,
  subscriptionTier: SubscriptionTier
): Promise<AdminTenantRecord> {
  const db = getAdminDb();
  const tierConfig = getTierConfig(subscriptionTier);
  const result = await db.query<AdminTenantRecord>(
    `
      UPDATE tenants
      SET subscription_tier = $1,
          features_enabled = $2::jsonb,
          limits = $3::jsonb,
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, company_name, slug, subscription_tier, status
    `,
    [
      subscriptionTier,
      JSON.stringify(tierConfig.features),
      JSON.stringify(tierConfig.limits),
      tenantId,
    ]
  );

  return result.rows[0];
}

export async function updateAdminTenant(
  tenantId: string,
  updates: {
    status?: AdminTenantStatus;
    subscription_tier?: SubscriptionTier;
    company_name?: string;
  }
): Promise<AdminTenantRecord> {
  const db = getAdminDb();
  const assignments: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.status !== undefined) {
    assignments.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }

  if (updates.subscription_tier !== undefined) {
    const tierConfig = getTierConfig(updates.subscription_tier);
    assignments.push(`subscription_tier = $${paramIndex++}`);
    values.push(updates.subscription_tier);
    assignments.push(`features_enabled = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(tierConfig.features));
    assignments.push(`limits = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(tierConfig.limits));
  }

  if (updates.company_name !== undefined) {
    assignments.push(`company_name = $${paramIndex++}`);
    values.push(updates.company_name);
  }

  assignments.push('updated_at = NOW()');
  values.push(tenantId);

  const result = await db.query<AdminTenantRecord>(
    `
      UPDATE tenants
      SET ${assignments.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, company_name, slug, subscription_tier, status
    `,
    values
  );

  return result.rows[0];
}

export async function createAdminTenant(input: {
  company_name: string;
  slug: string;
  subscription_tier: SubscriptionTier;
  status: AdminTenantStatus;
}): Promise<AdminTenantRecord> {
  const db = getAdminDb();
  const tierConfig = getTierConfig(input.subscription_tier);
  const result = await db.query<AdminTenantRecord>(
    `
      INSERT INTO tenants (
        id,
        company_name,
        slug,
        subscription_tier,
        status,
        features_enabled,
        limits,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, NOW(), NOW())
      RETURNING id, company_name, slug, subscription_tier, status
    `,
    [
      crypto.randomUUID(),
      input.company_name,
      input.slug,
      input.subscription_tier,
      input.status,
      JSON.stringify(tierConfig.features),
      JSON.stringify(tierConfig.limits),
    ]
  );

  return result.rows[0];
}

export async function deleteAdminTenant(tenantId: string): Promise<void> {
  const db = getAdminDb();
  await db.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
}
