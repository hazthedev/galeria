// ============================================
// Galeria - Admin Tenant Detail API
// ============================================
// Super admin endpoints for managing individual tenants

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';
import { logSimpleAdminAction } from '@/lib/audit/middleware';
import { getTierConfig } from '@/lib/tenant';

type TenantStatus = 'active' | 'suspended' | 'trialing';

/**
 * GET /api/admin/tenants/[tenantId]
 * Get detailed information about a specific tenant
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const params = await context.params;
  const tenantId = params['tenantId'];
  const db = getTenantDb(SYSTEM_TENANT_ID);

  // Get tenant details with statistics
  const tenantResult = await db.query(
    `SELECT
      t.*,
      COUNT(DISTINCT e.id) FILTER (WHERE e.id IS NOT NULL) as event_count,
      COUNT(DISTINCT u.id) FILTER (WHERE u.id IS NOT NULL) as user_count,
      COUNT(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL) as photo_count,
      (
        SELECT COUNT(*) FROM events WHERE tenant_id = $1 AND status = 'active'
      ) as active_events_count,
      (
        SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'organizer'
      ) as organizer_count,
      (
        SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'guest'
      ) as guest_count
    FROM tenants t
    LEFT JOIN events e ON e.tenant_id = t.id
    LEFT JOIN users u ON u.tenant_id = t.id
    LEFT JOIN photos p ON p.tenant_id = t.id
    WHERE t.id = $1
    GROUP BY t.id`,
    [tenantId]
  );

  const tenant = tenantResult.rows[0];

  if (!tenant) {
    return NextResponse.json(
      { error: 'Tenant not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: tenant });
}

/**
 * PATCH /api/admin/tenants/[tenantId]
 * Update tenant (status, subscription tier, etc.)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const params = await context.params;
  const tenantId = params['tenantId'];
  const body = await request.json();
  const { subscription_tier, status, company_name } = body;

  const db = getTenantDb(SYSTEM_TENANT_ID);

  // Get current tenant for audit logging
  const currentTenant = await db.findOne<{
    id: string;
    company_name: string;
    subscription_tier: string;
    status: string;
  }>(
    'tenants',
    { id: tenantId }
  );

  if (!currentTenant) {
    return NextResponse.json(
      { error: 'Tenant not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  // Prevent modifying system tenant
  if (tenantId === SYSTEM_TENANT_ID) {
    return NextResponse.json(
      { error: 'Cannot modify system tenant', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;
  let auditAction: string | null = null;

  if (subscription_tier !== undefined) {
    if (!['free', 'pro', 'premium', 'enterprise', 'tester'].includes(subscription_tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    updates.push(`subscription_tier = $${paramIndex++}`);
    values.push(subscription_tier);
    auditAction = 'tenant.plan_changed';

    // Update tenant features and limits based on new tier
    const tierConfig = getTierConfig(subscription_tier);
    await db.query(
      `UPDATE tenants
       SET features_enabled = $1::jsonb,
           limits = $2::jsonb
       WHERE id = $3`,
      [JSON.stringify(tierConfig.features), JSON.stringify(tierConfig.limits), tenantId]
    );
  }

  if (status !== undefined) {
    if (!['active', 'suspended', 'trialing'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    updates.push(`status = $${paramIndex++}`);
    values.push(status);

    if (!auditAction) auditAction = status === 'suspended' ? 'tenant.suspended' : 'tenant.activated';
  }

  if (company_name !== undefined) {
    updates.push(`company_name = $${paramIndex++}`);
    values.push(company_name);
    if (!auditAction) auditAction = 'tenant.updated';
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { error: 'No changes provided', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  updates.push('updated_at = NOW()');
  values.push(tenantId);

  await db.query(
    `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  // Log audit trail
  await logSimpleAdminAction(request, auth.user, auditAction as any, {
    targetId: tenantId,
    targetType: 'tenant',
    reason: `Updated tenant: ${currentTenant.company_name}`,
  });

  // Return updated tenant
  const updatedTenant = await db.findOne('tenants', { id: tenantId });

  return NextResponse.json({ data: updatedTenant });
}

/**
 * DELETE /api/admin/tenants/[tenantId]
 * Delete a tenant (CANNOT delete system tenant)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const params = await context.params;
  const tenantId = params['tenantId'];
  const db = getTenantDb(SYSTEM_TENANT_ID);

  // Prevent deleting system tenant
  if (tenantId === SYSTEM_TENANT_ID) {
    return NextResponse.json(
      { error: 'Cannot delete system tenant', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  // Get tenant info for audit before deletion
  const tenant = await db.findOne<{
    id: string;
    company_name: string;
    slug: string;
  }>(
    'tenants',
    { id: tenantId }
  );

  if (!tenant) {
    return NextResponse.json(
      { error: 'Tenant not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  // Delete tenant (cascade will handle related records via DB constraints)
  await db.query('DELETE FROM tenants WHERE id = $1', [tenantId]);

  // Log audit trail
  await logSimpleAdminAction(request, auth.user, 'tenant.deleted', {
    targetId: tenantId,
    targetType: 'tenant',
    reason: `Deleted tenant: ${tenant.company_name} (${tenant.slug})`,
  });

  return NextResponse.json({ success: true });
}
