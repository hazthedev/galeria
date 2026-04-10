import 'server-only';

import { getAdminDb } from '@/lib/domain/admin/context';
import type { AdminAuditLogItem } from '@/lib/domain/admin/types';

export interface ListAdminAuditLogsOptions {
  page: number;
  limit: number;
  action?: string | null;
  targetType?: string | null;
  from?: string | null;
  to?: string | null;
}

export async function listAdminAuditLogs(options: ListAdminAuditLogsOptions) {
  const db = getAdminDb();
  const offset = (options.page - 1) * options.limit;

  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options.action && options.action !== 'all') {
    whereClause += ` AND a.action = $${paramIndex++}`;
    params.push(options.action);
  }

  if (options.targetType && options.targetType !== 'all') {
    whereClause += ` AND a.target_type = $${paramIndex++}`;
    params.push(options.targetType);
  }

  if (options.from) {
    whereClause += ` AND a.created_at >= $${paramIndex++}::date`;
    params.push(options.from);
  }

  if (options.to) {
    whereClause += ` AND a.created_at < ($${paramIndex++}::date + INTERVAL '1 day')`;
    params.push(options.to);
  }

  const logsResult = await db.query<{
    id: string;
    admin_id: string;
    admin_name: string | null;
    admin_email: string | null;
    action: string;
    target_type: string | null;
    target_id: string | null;
    reason: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
  }>(
    `
      SELECT
        a.id,
        a.admin_id,
        a.action,
        a.target_type,
        a.target_id,
        a.reason,
        a.old_values,
        a.new_values,
        a.ip_address,
        a.user_agent,
        a.created_at,
        u.name AS admin_name,
        u.email AS admin_email
      FROM admin_audit_logs a
      LEFT JOIN users u ON u.id = a.admin_id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...params, options.limit, offset]
  );

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM admin_audit_logs a WHERE ${whereClause}`,
    params
  );

  const items: AdminAuditLogItem[] = logsResult.rows.map((row) => ({
    id: row.id,
    admin_id: row.admin_id,
    admin_name: row.admin_name,
    admin_email: row.admin_email,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    reason: row.reason,
    old_values: row.old_values,
    new_values: row.new_values,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
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
