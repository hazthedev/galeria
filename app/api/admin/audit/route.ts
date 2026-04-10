// ============================================
// Galeria - Admin Audit Logs API
// ============================================
// Super admin endpoints for viewing audit logs

import { NextRequest, NextResponse } from 'next/server';

import {
  createAdminErrorResponse,
  createAdminPaginatedResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { listAdminAuditLogs } from '@/lib/services/admin/audit';

/**
 * GET /api/admin/audit
 * List audit logs with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const result = await listAdminAuditLogs({
      page,
      limit,
      action,
      targetType,
      from,
      to,
    });

    return createAdminPaginatedResponse(result.items, result.pagination);
  } catch (error) {
    console.error('[ADMIN_AUDIT] Error:', error);
    return createAdminErrorResponse('Failed to load audit logs', 'INTERNAL_ERROR');
  }
}
