// ============================================
// Galeria - Admin Tenant Management API
// ============================================
// Super admin endpoints for managing all platform tenants

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';
import { logSimpleAdminAction } from '@/lib/audit/middleware';
import crypto from 'crypto';

type TenantStatus = 'active' | 'suspended' | 'trialing';

/**
 * GET /api/admin/tenants
 * List all tenants with pagination and filters
 */
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const status = searchParams.get('status'); // active, suspended, all
  const tier = searchParams.get('tier'); // free, pro, premium, enterprise

  const offset = (page - 1) * limit;
  const db = getTenantDb(SYSTEM_TENANT_ID);

  // Build query conditions
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (status && status !== 'all') {
    whereClause += ` AND t.status = $${paramIndex++}`;
    params.push(status);
  }

  if (tier && tier !== 'all') {
    whereClause += ` AND t.subscription_tier = $${paramIndex++}`;
    params.push(tier);
  }

  const tenantsResult = await db.query(
    `SELECT
      t.id,
      t.company_name,
      t.slug,
      t.subscription_tier,
      t.status,
      t.created_at,
      t.updated_at,
      COUNT(DISTINCT e.id) FILTER (WHERE e.id IS NOT NULL) as event_count,
      COUNT(DISTINCT u.id) FILTER (WHERE u.id IS NOT NULL) as user_count,
      COUNT(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL) as photo_count
    FROM tenants t
    LEFT JOIN events e ON e.tenant_id = t.id
    LEFT JOIN users u ON u.tenant_id = t.id
    LEFT JOIN photos p ON p.tenant_id = t.id
    WHERE ${whereClause}
    GROUP BY t.id
    ORDER BY t.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as count FROM tenants t WHERE ${whereClause}`,
    params.slice(0, paramIndex - 1)
  );

  const total = Number(countResult.rows[0]?.count || 0);

  return NextResponse.json({
    data: tenantsResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * POST /api/admin/tenants
 * Create a new tenant
 */
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { company_name, slug, subscription_tier = 'free', status = 'active' } = body;

  // Validation
  if (!company_name || !slug) {
    return NextResponse.json(
      { error: 'company_name and slug are required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  if (!['free', 'pro', 'premium', 'enterprise', 'tester'].includes(subscription_tier)) {
    return NextResponse.json(
      { error: 'Invalid subscription tier', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  if (!['active', 'suspended', 'trialing'].includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const db = getTenantDb(SYSTEM_TENANT_ID);

  // Check if slug exists
  const existing = await db.findOne('tenants', { slug });
  if (existing) {
    return NextResponse.json(
      { error: 'Slug already exists', code: 'SLUG_EXISTS' },
      { status: 409 }
    );
  }

  // Create tenant
  const tenantId = crypto.randomUUID();
  const tenant = await db.insert('tenants', {
    id: tenantId,
    company_name,
    slug,
    subscription_tier,
    status,
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Log audit trail
  await logSimpleAdminAction(request, auth.user, 'tenant.created', {
    targetId: tenantId,
    targetType: 'tenant',
    reason: `Created tenant: ${company_name} (${slug})`,
  });

  return NextResponse.json({ data: tenant }, { status: 201 });
}
