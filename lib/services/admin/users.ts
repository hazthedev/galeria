import 'server-only';

import { getRedisClient } from '@/lib/infrastructure/cache/redis';
import { getKey } from '@/lib/redis';
import {
  getAdminDb,
  isMissingColumnError,
  isMissingSchemaResourceError,
} from '@/lib/domain/admin/context';
import { extractSessionId, getSessionTTL, type ISessionData } from '@/lib/domain/auth/session';
import {
  getSupabaseServerAuthClient,
  isSupabaseAuthConfigured,
} from '@/lib/infrastructure/auth/supabase-server';
import type {
  AdminAuditTimelineItem,
  AdminUserDetailData,
  AdminUserListItem,
  AdminUserRelatedEventSummary,
  AdminUserRole,
  AdminUserSessionSummary,
} from '@/lib/domain/admin/types';
import { getTierConfig } from '@/lib/tenant';
import type { SubscriptionTier } from '@/lib/types';

export type { AdminUserRole } from '@/lib/domain/admin/types';

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string | null;
  role: AdminUserRole;
  tenant_id: string;
  subscription_tier?: SubscriptionTier | null;
  totp_enabled?: boolean;
}

export interface ListAdminUsersOptions {
  page: number;
  limit: number;
  role?: string | null;
  search?: string | null;
}

interface AdminUserCompatibilityOptions {
  includeTenantSlug: boolean;
  includeUserSubscriptionTier: boolean;
  includeTotpEnabled: boolean;
}

const FULL_ADMIN_USER_COMPATIBILITY: AdminUserCompatibilityOptions = {
  includeTenantSlug: true,
  includeUserSubscriptionTier: true,
  includeTotpEnabled: true,
};

const LEGACY_ADMIN_USER_COMPATIBILITY: AdminUserCompatibilityOptions = {
  includeTenantSlug: false,
  includeUserSubscriptionTier: false,
  includeTotpEnabled: false,
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

function parseDeviceInfo(userAgent?: string): string {
  if (!userAgent) {
    return 'Unknown device';
  }

  const ua = userAgent.toLowerCase();

  let browser = 'Unknown browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('opr/') || ua.includes('opera/')) browser = 'Opera';

  let os = 'Unknown OS';
  if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone os') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  const isMobile = /android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);
  return `${browser} on ${os}${isMobile ? ' (Mobile)' : ''}`;
}

async function listAdminUserSessions(
  userId: string,
  currentSessionId?: string | null
): Promise<AdminUserSessionSummary[]> {
  const redis = getRedisClient();
  const sessions: AdminUserSessionSummary[] = [];

  let cursor = '0';

  do {
    const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'session:*', 'COUNT', '100');
    cursor = newCursor;

    for (const key of keys) {
      const sessionData = await getKey<ISessionData>(key);
      if (!sessionData || sessionData.userId !== userId) {
        continue;
      }

      const sessionId = key.replace('session:', '');
      sessions.push({
        session_id: sessionId,
        created_at: sessionData.createdAt,
        last_activity: sessionData.lastActivity,
        expires_at: sessionData.expiresAt,
        remember_me: sessionData.rememberMe,
        ip_address: sessionData.ipAddress || null,
        user_agent: sessionData.userAgent || null,
        device_info: parseDeviceInfo(sessionData.userAgent),
        is_current: sessionId === currentSessionId,
        ttl: await getSessionTTL(sessionId),
      });
    }
  } while (cursor !== '0');

  sessions.sort((a, b) => {
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    return b.last_activity - a.last_activity;
  });

  return sessions;
}

function getAdminUserSubscriptionTierSql(options: AdminUserCompatibilityOptions): string {
  if (options.includeUserSubscriptionTier) {
    return `
        CASE
          WHEN u.role = 'super_admin' THEN COALESCE(u.subscription_tier::text, 'free')
          ELSE COALESCE(t.subscription_tier::text, u.subscription_tier::text, 'free')
        END AS subscription_tier,
        u.subscription_tier::text AS user_subscription_tier,
        t.subscription_tier::text AS tenant_subscription_tier,
    `;
  }

  return `
        CASE
          WHEN u.role = 'super_admin' THEN 'free'
          ELSE COALESCE(t.subscription_tier::text, 'free')
        END AS subscription_tier,
        NULL::text AS user_subscription_tier,
        t.subscription_tier::text AS tenant_subscription_tier,
  `;
}

function getAdminUserTenantSlugSql(options: AdminUserCompatibilityOptions): string {
  return options.includeTenantSlug ? 't.subdomain AS tenant_slug,' : 'NULL::text AS tenant_slug,';
}

function getAdminUserTotpSql(options: AdminUserCompatibilityOptions): string {
  return options.includeTotpEnabled ? 'COALESCE(u.totp_enabled, false) AS totp_enabled' : 'false AS totp_enabled';
}

async function listAdminUsersWithCompatibility(
  options: ListAdminUsersOptions,
  compatibility: AdminUserCompatibilityOptions
) {
  const db = getAdminDb();
  const offset = (options.page - 1) * options.limit;

  let whereClause = '1=1';
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (options.role && options.role !== 'all') {
    whereClause += ` AND u.role = $${paramIndex++}`;
    params.push(options.role);
  }

  if (options.search) {
    whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex + 1})`;
    params.push(`%${options.search}%`, `%${options.search}%`);
    paramIndex += 2;
  }

  const usersResult = await db.query<{
    id: string;
    email: string;
    name: string | null;
    role: AdminUserRole;
    tenant_id: string;
    subscription_tier: string;
    user_subscription_tier: string | null;
    tenant_subscription_tier: string | null;
    tenant_name: string | null;
    created_at: Date;
    last_login_at: Date | null;
    email_verified: boolean;
    totp_enabled: boolean;
  }>(
    `
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.tenant_id,
        ${getAdminUserSubscriptionTierSql(compatibility)}
        t.company_name AS tenant_name,
        u.created_at,
        u.last_login_at,
        COALESCE(u.email_verified, false) AS email_verified,
        ${getAdminUserTotpSql(compatibility)}
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...params, options.limit, offset]
  );

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM users u WHERE ${whereClause}`,
    params
  );

  const items: AdminUserListItem[] = usersResult.rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    tenant_id: row.tenant_id,
    tenant_name: row.tenant_name,
    subscription_tier: row.subscription_tier,
    user_subscription_tier: row.user_subscription_tier,
    tenant_subscription_tier: row.tenant_subscription_tier,
    created_at: row.created_at.toISOString(),
    last_login_at: toIsoString(row.last_login_at),
    email_verified: row.email_verified,
    totp_enabled: row.totp_enabled,
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

export async function listAdminUsers(options: ListAdminUsersOptions) {
  try {
    return await listAdminUsersWithCompatibility(options, FULL_ADMIN_USER_COMPATIBILITY);
  } catch (error) {
    if (isMissingColumnError(error)) {
      return listAdminUsersWithCompatibility(options, LEGACY_ADMIN_USER_COMPATIBILITY);
    }

    throw error;
  }
}

export async function getAdminUserById(userId: string): Promise<AdminUserRecord | null> {
  const db = getAdminDb();
  return db.findOne<AdminUserRecord>('users', { id: userId });
}

async function getAdminUserDetailWithCompatibility(
  userId: string,
  compatibility: AdminUserCompatibilityOptions,
  requestHeaders?: { cookie?: string | null; authorization?: string | null }
): Promise<AdminUserDetailData | null> {
  const db = getAdminDb();

  const userResult = await db.query<{
    id: string;
    email: string;
    name: string | null;
    role: AdminUserRole;
    tenant_id: string;
    tenant_name: string | null;
    tenant_status: string | null;
    tenant_slug: string | null;
    subscription_tier: string;
    user_subscription_tier: string | null;
    tenant_subscription_tier: string | null;
    created_at: Date;
    last_login_at: Date | null;
    email_verified: boolean;
    totp_enabled: boolean;
  }>(
    `
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.tenant_id,
        t.company_name AS tenant_name,
        t.status AS tenant_status,
        ${getAdminUserTenantSlugSql(compatibility)}
        ${getAdminUserSubscriptionTierSql(compatibility)}
        u.created_at,
        u.last_login_at,
        COALESCE(u.email_verified, false) AS email_verified,
        ${getAdminUserTotpSql(compatibility)}
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE u.id = $1
    `,
    [userId]
  );

  const row = userResult.rows[0];
  if (!row) {
    return null;
  }

  const relatedEventsResult = await db.query<{
    id: string;
    name: string;
    short_code: string | null;
    status: string;
    event_date: Date | string | null;
    created_at: Date;
  }>(
    row.role === 'organizer'
      ? `
        SELECT
          e.id,
          e.name,
          e.short_code,
          e.status,
          e.event_date,
          e.created_at
        FROM events e
        WHERE e.organizer_id = $1
        ORDER BY e.created_at DESC
        LIMIT 6
      `
      : `
        SELECT
          e.id,
          e.name,
          e.short_code,
          e.status,
          e.event_date,
          e.created_at
        FROM events e
        WHERE e.tenant_id = $1
        ORDER BY e.created_at DESC
        LIMIT 6
      `,
    [row.role === 'organizer' ? userId : row.tenant_id]
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
        WHERE a.target_type = 'user'
          AND a.target_id = $1
        ORDER BY a.created_at DESC
        LIMIT 8
      `,
      [userId]
    );

    recentAuditRows = recentAuditResult.rows;
  } catch (error) {
    if (!isMissingSchemaResourceError(error)) {
      throw error;
    }
  }

  const currentSessionId = requestHeaders
    ? extractSessionId(requestHeaders.cookie || null, requestHeaders.authorization || null).sessionId
    : null;
  const recentSessions = await listAdminUserSessions(userId, currentSessionId);

  const user: AdminUserListItem = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    tenant_id: row.tenant_id,
    tenant_name: row.tenant_name,
    subscription_tier: row.subscription_tier,
    user_subscription_tier: row.user_subscription_tier,
    tenant_subscription_tier: row.tenant_subscription_tier,
    created_at: row.created_at.toISOString(),
    last_login_at: toIsoString(row.last_login_at),
    email_verified: row.email_verified,
    totp_enabled: row.totp_enabled,
  };

  const relatedEvents: AdminUserRelatedEventSummary[] = relatedEventsResult.rows.map((event) => ({
    id: event.id,
    name: event.name,
    short_code: event.short_code,
    status: event.status,
    event_date: toIsoString(event.event_date),
    created_at: event.created_at.toISOString(),
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
    user,
    session_count: recentSessions.length,
    active_session_count: recentSessions.filter((session) => session.ttl > 0).length,
    tenant_status: row.tenant_status,
    tenant_slug: row.tenant_slug,
    relatedEvents,
    recentSessions: recentSessions.slice(0, 6),
    recentAudit,
  };
}

export async function getAdminUserDetail(
  userId: string,
  requestHeaders?: { cookie?: string | null; authorization?: string | null }
): Promise<AdminUserDetailData | null> {
  try {
    return await getAdminUserDetailWithCompatibility(
      userId,
      FULL_ADMIN_USER_COMPATIBILITY,
      requestHeaders
    );
  } catch (error) {
    if (isMissingColumnError(error)) {
      return getAdminUserDetailWithCompatibility(
        userId,
        LEGACY_ADMIN_USER_COMPATIBILITY,
        requestHeaders
      );
    }

    throw error;
  }
}

export async function updateAdminUserRole(
  userId: string,
  role: AdminUserRole
): Promise<AdminUserRecord> {
  const db = getAdminDb();
  const result = await db.query<AdminUserRecord>(
    `
      UPDATE users
      SET role = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, name, role, tenant_id, subscription_tier
    `,
    [role, userId]
  );

  return result.rows[0];
}

export async function updateAdminUserSubscriptionTier(
  user: AdminUserRecord,
  subscriptionTier: SubscriptionTier
): Promise<{
  targetId: string;
  targetType: 'user' | 'tenant';
  subscription_tier: SubscriptionTier;
}> {
  const db = getAdminDb();

  if (user.role === 'super_admin') {
    await db.query(
      `
        UPDATE users
        SET subscription_tier = $1,
            updated_at = NOW()
        WHERE id = $2
      `,
      [subscriptionTier, user.id]
    );

    return {
      targetId: user.id,
      targetType: 'user',
      subscription_tier: subscriptionTier,
    };
  }

  const tierConfig = getTierConfig(subscriptionTier);
  await db.query(
    `
      UPDATE tenants
      SET subscription_tier = $1,
          features_enabled = $2::jsonb,
          limits = $3::jsonb,
          updated_at = NOW()
      WHERE id = $4
    `,
    [
      subscriptionTier,
      JSON.stringify(tierConfig.features),
      JSON.stringify(tierConfig.limits),
      user.tenant_id,
    ]
  );

  return {
    targetId: user.tenant_id,
    targetType: 'tenant',
    subscription_tier: subscriptionTier,
  };
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const db = getAdminDb();
  await db.query('DELETE FROM users WHERE id = $1', [userId]);
}

export async function disableAdminUserMfa(userId: string): Promise<{
  id: string;
  totp_enabled: boolean;
}> {
  const db = getAdminDb();
  const result = await db.query<{
    id: string;
    totp_enabled: boolean;
  }>(
    `
      UPDATE users
      SET totp_secret = NULL,
          totp_enabled = false,
          totp_verified_at = NULL,
          recovery_codes = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, COALESCE(totp_enabled, false) AS totp_enabled
    `,
    [userId]
  );

  return result.rows[0];
}

export async function sendAdminUserPasswordResetEmail(options: {
  email: string;
  redirectBaseUrl?: string | null;
}): Promise<{
  sent: boolean;
}> {
  if (!isSupabaseAuthConfigured()) {
    throw new Error('AUTH_NOT_CONFIGURED');
  }

  const baseUrl = (options.redirectBaseUrl || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const redirectTo = baseUrl
    ? `${baseUrl}/auth/reset-password`
    : 'http://localhost:3000/auth/reset-password';

  const supabase = getSupabaseServerAuthClient();
  const { error } = await supabase.auth.resetPasswordForEmail(options.email, {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message || 'RESET_FAILED');
  }

  return {
    sent: true,
  };
}
