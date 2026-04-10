// ============================================
// Galeria - Supervisor Recent Activity API
// ============================================

import { NextRequest, NextResponse } from 'next/server';

import {
  createAdminDataResponse,
  createAdminErrorResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { isAdminDatabaseError } from '@/lib/domain/admin/context';
import { getAdminRecentActivity } from '@/lib/services/admin/overview';

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12', 10), 50);
    const activity = await getAdminRecentActivity(limit);

    return createAdminDataResponse(activity);
  } catch (error) {
    console.error('[SUPERVISOR_ACTIVITY] Error:', error);
    if (isAdminDatabaseError(error)) {
      return createAdminDataResponse([]);
    }

    return createAdminErrorResponse('Failed to fetch recent activity', 'INTERNAL_ERROR');
  }
}
