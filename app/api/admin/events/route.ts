// ============================================
// Galeria - Admin Events API
// ============================================
// Super admin endpoints for viewing events across all tenants

import { NextRequest, NextResponse } from 'next/server';

import {
  createAdminErrorResponse,
  createAdminPaginatedResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { listAdminEvents } from '@/lib/services/admin/events';

/**
 * GET /api/admin/events
 * List events across all tenants with filters
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId');
    const search = searchParams.get('search');

    const result = await listAdminEvents({
      page,
      limit,
      status,
      tenantId,
      search,
    });

    return createAdminPaginatedResponse(result.items, result.pagination);
  } catch (error) {
    console.error('[Admin Events API] Failed to load events:', error);
    return createAdminErrorResponse('Failed to load events', 'INTERNAL_ERROR');
  }
}
