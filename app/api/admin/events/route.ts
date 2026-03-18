// ============================================
// Galeria - Admin Events API
// ============================================
// Super admin endpoints for viewing events across all tenants

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';

/**
 * GET /api/admin/events
 * List events across all tenants with filters
 */
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const status = searchParams.get('status'); // active, ended, all
  const tenantId = searchParams.get('tenantId'); // Filter by tenant
  const search = searchParams.get('search'); // Search by name or code

  const offset = (page - 1) * limit;
  const db = getTenantDb(SYSTEM_TENANT_ID);

  // Build query conditions
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (status && status !== 'all') {
    whereClause += ` AND e.status = $${paramIndex++}`;
    params.push(status);
  }

  if (tenantId && tenantId !== 'all') {
    whereClause += ` AND e.tenant_id = $${paramIndex++}`;
    params.push(tenantId);
  }

  if (search) {
    whereClause += ` AND (e.name ILIKE $${paramIndex} OR e.short_code ILIKE $${paramIndex + 1})`;
    params.push(`%${search}%`, `%${search}%`);
    paramIndex += 2;
  }

  const eventsResult = await db.query(
    `SELECT
      e.id,
      e.tenant_id,
      e.name,
      e.short_code,
      e.status,
      e.start_date,
      e.end_date,
      e.settings,
      e.created_at,
      t.company_name,
      t.slug AS tenant_slug,
      COUNT(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL) as photo_count,
      COUNT(DISTINCT u.id) FILTER (WHERE u.id IS NOT NULL AND u.role = 'guest') as guest_count,
      COUNT(DISTINCT att.id) FILTER (WHERE att.id IS NOT NULL) as attendance_count
    FROM events e
    LEFT JOIN tenants t ON t.id = e.tenant_id
    LEFT JOIN photos p ON p.event_id = e.id
    LEFT JOIN users u ON u.tenant_id = e.tenant_id
    LEFT JOIN attendance att ON att.event_id = e.id
    WHERE ${whereClause}
    GROUP BY e.id, t.company_name, t.slug
    ORDER BY e.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as count FROM events e WHERE ${whereClause}`,
    params.slice(0, paramIndex - 1)
  );

  const total = Number(countResult.rows[0]?.count || 0);

  return NextResponse.json({
    data: eventsResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
