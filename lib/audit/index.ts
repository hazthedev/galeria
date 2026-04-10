// ============================================
// Galeria - Admin Audit Logging
// ============================================
// Audit logging system for tracking all super admin actions
// Essential for security compliance and troubleshooting

import 'server-only';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';

// ============================================
// TYPES
// ============================================

export type AuditAction =
  | 'user.created'
  | 'user.deleted'
  | 'user.role_changed'
  | 'user.tier_changed'
  | 'user.password_reset'
  | 'user.mfa_disabled'
  | 'user.impersonation_started'
  | 'user.impersonation_ended'
  | 'tenant.created'
  | 'tenant.updated'
  | 'tenant.deleted'
  | 'tenant.suspended'
  | 'tenant.activated'
  | 'tenant.plan_changed'
  | 'event.deleted'
  | 'event.status_changed'
  | 'event.uploads_enabled'
  | 'event.uploads_disabled'
  | 'photo.approved'
  | 'photo.rejected'
  | 'photo.deleted'
  | 'settings.updated'
  | 'moderation.enabled'
  | 'moderation.disabled'
  | 'moderation.threshold_changed'
  | 'session.revoked'
  | 'session.all_revoked'
  | 'admin.mfa_enabled'
  | 'admin.mfa_disabled'
  | 'admin.mfa_setup_initiated'
  | 'admin.mfa_setup_cancelled'
  | 'bulk.users_role_changed'
  | 'bulk.users_deleted'
  | 'export.users'
  | 'export.events';

export interface AuditLogOptions {
  adminId: string;
  action: AuditAction;
  targetType?: 'user' | 'tenant' | 'event' | 'photo' | 'settings' | 'session' | 'moderation';
  targetId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilter {
  adminId?: string;
  action?: AuditAction;
  targetType?: string;
  targetId?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// FUNCTIONS
// ============================================

/**
 * Log an admin action to the audit log
 * This should be called after every admin action for security compliance
 */
export async function logAdminAction(options: AuditLogOptions): Promise<void> {
  const db = getTenantDb(SYSTEM_TENANT_ID);

  try {
    await db.query(
      `INSERT INTO admin_audit_logs (
        admin_id, action, target_type, target_id,
        old_values, new_values, reason, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        options.adminId,
        options.action,
        options.targetType || null,
        options.targetId || null,
        options.oldValues ? JSON.stringify(options.oldValues) : null,
        options.newValues ? JSON.stringify(options.newValues) : null,
        options.reason || null,
        options.ipAddress || null,
        options.userAgent || null,
      ]
    );
  } catch (error) {
    // Log errors but don't throw - audit logging failure shouldn't break the main action
    console.error('[AUDIT_LOG] Failed to log admin action:', {
      action: options.action,
      adminId: options.adminId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get audit logs with optional filters
 * Returns paginated results with admin details
 */
export async function getAuditLogs(filters: AuditLogFilter = {}) {
  const db = getTenantDb(SYSTEM_TENANT_ID);

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.adminId) {
    conditions.push(`a.admin_id = $${paramIndex++}`);
    params.push(filters.adminId);
  }

  if (filters.action) {
    conditions.push(`a.action = $${paramIndex++}`);
    params.push(filters.action);
  }

  if (filters.targetType) {
    conditions.push(`a.target_type = $${paramIndex++}`);
    params.push(filters.targetType);
  }

  if (filters.targetId) {
    conditions.push(`a.target_id = $${paramIndex++}`);
    params.push(filters.targetId);
  }

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const result = await db.query(
    `SELECT
      a.id,
      a.admin_id,
      a.action,
      a.target_type,
      a.target_id,
      a.old_values,
      a.new_values,
      a.reason,
      a.ip_address,
      a.user_agent,
      a.created_at,
      u.name as admin_name,
      u.email as admin_email
    FROM admin_audit_logs a
    LEFT JOIN users u ON u.id = a.admin_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as count FROM admin_audit_logs a WHERE ${conditions.join(' AND ')}`,
    params.slice(0, paramIndex - 1)
  );

  return {
    logs: result.rows,
    total: Number(countResult.rows[0]?.count || 0),
  };
}

/**
 * Get a single audit log by ID with full details
 */
export async function getAuditLogById(logId: string) {
  const db = getTenantDb(SYSTEM_TENANT_ID);

  const result = await db.query(
    `SELECT
      a.*,
      u.name as admin_name,
      u.email as admin_email
    FROM admin_audit_logs a
    LEFT JOIN users u ON u.id = a.admin_id
    WHERE a.id = $1`,
    [logId]
  );

  return result.rows[0] || null;
}

/**
 * Get audit statistics for a time period
 * Useful for admin dashboard analytics
 */
export async function getAuditStats(options: {
  adminId?: string;
  days?: number;
}) {
  const db = getTenantDb(SYSTEM_TENANT_ID);

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options.adminId) {
    conditions.push(`admin_id = $${paramIndex++}`);
    params.push(options.adminId);
  }

  if (options.days) {
    conditions.push(`created_at > NOW() - INTERVAL '${options.days} days'`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await db.query(
    `SELECT
      action,
      COUNT(*) as count
    FROM admin_audit_logs
    ${whereClause}
    GROUP BY action
    ORDER BY count DESC`
  );

  return result.rows;
}

/**
 * Helper to extract IP address from request headers
 */
export function extractIpAddress(headers: Headers): string | undefined {
  // Check various headers for IP address
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    undefined
  );
}

/**
 * Helper to extract user agent from request headers
 */
export function extractUserAgent(headers: Headers): string | undefined {
  return headers.get('user-agent') || undefined;
}

/**
 * Create audit log options from a NextRequest
 */
export function createAuditLogOptions(
  adminId: string,
  action: AuditAction,
  request: Request,
  additionalOptions?: Partial<Omit<AuditLogOptions, 'adminId' | 'action' | 'ipAddress' | 'userAgent'>>
): AuditLogOptions {
  const headers = new Headers(request.headers);

  return {
    adminId,
    action,
    ipAddress: extractIpAddress(headers),
    userAgent: extractUserAgent(headers),
    ...additionalOptions,
  };
}
