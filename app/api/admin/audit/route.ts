// ============================================
// Galeria - Admin Audit Logs API
// ============================================
// Super admin endpoints for viewing audit logs

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';

/**
 * GET /api/admin/audit
 * List audit logs with pagination and filters
 */
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const action = searchParams.get('action');
  const targetType = searchParams.get('targetType');

  const offset = (page - 1) * limit;
  const db = getTenantDb(SYSTEM_TENANT_ID);

  // Build query conditions
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (action && action !== 'all') {
    whereClause += ` AND a.action = $${paramIndex++}`;
    params.push(action);
  }

  if (targetType && targetType !== 'all') {
    whereClause += ` AND a.target_type = $${paramIndex++}`;
    params.push(targetType);
  }

  const logsResult = await db.query(
    `SELECT
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
      u.name as admin_name,
      u.email as admin_email
    FROM admin_audit_logs a
    LEFT JOIN users u ON u.id = a.admin_id
    WHERE ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as count FROM admin_audit_logs a WHERE ${whereClause}`,
    params.slice(0, paramIndex - 1)
  );

  const total = Number(countResult.rows[0]?.count || 0);

  return NextResponse.json({
    data: logsResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
