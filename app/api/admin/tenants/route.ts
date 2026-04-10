// ============================================
// Galeria - Admin Tenant Management API
// ============================================
// Super admin endpoints for managing all platform tenants

import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminDataResponse,
  createAdminErrorResponse,
  createAdminPaginatedResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { logSimpleAdminAction } from '@/lib/audit/middleware';
import {
  createAdminTenant,
  getAdminTenantBySlug,
  listAdminTenants,
} from '@/lib/services/admin/tenants';

/**
 * GET /api/admin/tenants
 * List all tenants with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) return access;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const status = searchParams.get('status'); // active, suspended, all
    const tier = searchParams.get('tier'); // free, pro, premium, enterprise
    const search = searchParams.get('search');

    const result = await listAdminTenants({
      page,
      limit,
      status,
      tier,
      search,
    });

    return createAdminPaginatedResponse(result.items, result.pagination);
  } catch (error) {
    console.error('[Admin Tenants API] Failed to load tenants:', error);
    return createAdminErrorResponse('Failed to load tenants', 'INTERNAL_ERROR');
  }
}

/**
 * POST /api/admin/tenants
 * Create a new tenant
 */
export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) return access;

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

    const existing = await getAdminTenantBySlug(slug);
    if (existing) {
      return createAdminErrorResponse('Slug already exists', 'VALIDATION_ERROR', 409);
    }

    const tenant = await createAdminTenant({
      company_name,
      slug,
      subscription_tier,
      status,
    });

    await logSimpleAdminAction(request, access.auth.user, 'tenant.created', {
      targetId: tenant.id,
      targetType: 'tenant',
      reason: `Created tenant: ${company_name} (${slug})`,
    });

    return createAdminDataResponse(tenant, { status: 201 });
  } catch (error) {
    console.error('[Admin Tenants API] Failed to create tenant:', error);
    return createAdminErrorResponse('Failed to create tenant', 'INTERNAL_ERROR');
  }
}
