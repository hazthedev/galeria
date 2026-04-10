// ============================================
// Galeria - Admin Tenant Detail API
// ============================================
// Super admin endpoints for managing individual tenants

import { NextRequest, NextResponse } from 'next/server';

import { withAuditLog } from '@/lib/audit/middleware';
import {
  createAdminDataResponse,
  createAdminErrorResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import {
  deleteAdminTenant,
  getAdminTenantById,
  getAdminTenantDetail,
  isSystemTenantId,
  updateAdminTenant,
} from '@/lib/services/admin/tenants';
import type { SubscriptionTier } from '@/lib/types';

const validTenantStatuses = ['active', 'suspended', 'trialing'] as const;
const validSubscriptionTiers = ['free', 'pro', 'premium', 'enterprise', 'tester'] as const;

/**
 * GET /api/admin/tenants/[tenantId]
 * Get detailed information about a specific tenant
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) return access;

    const params = await context.params;
    const tenantId = params['tenantId'];
    const tenant = await getAdminTenantDetail(tenantId);

    if (!tenant) {
      return createAdminErrorResponse('Tenant not found', 'NOT_FOUND', 404);
    }

    return createAdminDataResponse(tenant);
  } catch (error) {
    console.error('[Admin Tenant Detail API] Failed to load tenant:', error);
    return createAdminErrorResponse('Failed to load tenant', 'INTERNAL_ERROR');
  }
}

/**
 * PATCH /api/admin/tenants/[tenantId]
 * Update tenant (status, subscription tier, etc.)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const params = await context.params;
    const tenantId = params['tenantId'];
    const body = await request.json();
    const { subscription_tier, status, company_name } = body || {};

    if (isSystemTenantId(tenantId)) {
      return createAdminErrorResponse('Cannot modify system tenant', 'VALIDATION_ERROR', 403);
    }

    if (
      status !== undefined &&
      !validTenantStatuses.includes(status as (typeof validTenantStatuses)[number])
    ) {
      return createAdminErrorResponse('Invalid status', 'VALIDATION_ERROR', 400);
    }

    if (
      subscription_tier !== undefined &&
      !validSubscriptionTiers.includes(
        subscription_tier as (typeof validSubscriptionTiers)[number]
      )
    ) {
      return createAdminErrorResponse('Invalid subscription tier', 'VALIDATION_ERROR', 400);
    }

    if (
      status === undefined &&
      subscription_tier === undefined &&
      company_name === undefined
    ) {
      return createAdminErrorResponse('No changes provided', 'VALIDATION_ERROR', 400);
    }

    const currentTenant = await getAdminTenantById(tenantId);
    if (!currentTenant) {
      return createAdminErrorResponse('Tenant not found', 'NOT_FOUND', 404);
    }

    const updatedTenant = await withAuditLog(
      request,
      access.auth.user,
      access.auth.session,
      subscription_tier !== undefined
        ? 'tenant.plan_changed'
        : status === 'suspended'
          ? 'tenant.suspended'
          : status === 'active'
            ? 'tenant.activated'
            : 'tenant.updated',
      {
        targetId: tenantId,
        targetType: 'tenant',
        reason: `Updated tenant: ${currentTenant.company_name}`,
        getOldValues: () => ({
          company_name: currentTenant.company_name,
          subscription_tier: currentTenant.subscription_tier,
          status: currentTenant.status,
        }),
        getNewValues: (result) => ({
          company_name: result.company_name,
          subscription_tier: result.subscription_tier,
          status: result.status,
        }),
      },
      () =>
        updateAdminTenant(tenantId, {
          status,
          subscription_tier: subscription_tier as SubscriptionTier | undefined,
          company_name,
        })
    );

    return createAdminDataResponse(updatedTenant);
  } catch (error) {
    console.error('[Admin Tenant Detail API] Failed to update tenant:', error);
    return createAdminErrorResponse('Failed to update tenant', 'INTERNAL_ERROR');
  }
}

/**
 * DELETE /api/admin/tenants/[tenantId]
 * Delete a tenant (cannot delete system tenant)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const params = await context.params;
    const tenantId = params['tenantId'];

    if (isSystemTenantId(tenantId)) {
      return createAdminErrorResponse('Cannot delete system tenant', 'VALIDATION_ERROR', 403);
    }

    const tenant = await getAdminTenantById(tenantId);
    if (!tenant) {
      return createAdminErrorResponse('Tenant not found', 'NOT_FOUND', 404);
    }

    const result = await withAuditLog(
      request,
      access.auth.user,
      access.auth.session,
      'tenant.deleted',
      {
        targetId: tenantId,
        targetType: 'tenant',
        reason: `Deleted tenant: ${tenant.company_name} (${tenant.slug})`,
        getOldValues: () => ({
          company_name: tenant.company_name,
          subscription_tier: tenant.subscription_tier,
          status: tenant.status,
        }),
        getNewValues: () => ({
          deleted: true,
        }),
      },
      async () => {
        await deleteAdminTenant(tenantId);
        return { deleted: true, tenantId };
      }
    );

    return createAdminDataResponse(result);
  } catch (error) {
    console.error('[Admin Tenant Detail API] Failed to delete tenant:', error);
    return createAdminErrorResponse('Failed to delete tenant', 'INTERNAL_ERROR');
  }
}
