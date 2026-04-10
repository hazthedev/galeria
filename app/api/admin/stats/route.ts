// ============================================
// Galeria - Supervisor Stats API
// ============================================

import { NextRequest, NextResponse } from 'next/server';

import {
  createAdminDataResponse,
  createAdminErrorResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { isAdminDatabaseError } from '@/lib/domain/admin/context';
import { EMPTY_ADMIN_OVERVIEW_STATS } from '@/lib/domain/admin/types';
import { getAdminOverviewStats } from '@/lib/services/admin/overview';

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const stats = await getAdminOverviewStats();
    return createAdminDataResponse(stats);
  } catch (error) {
    console.error('[SUPERVISOR_STATS] Error:', error);
    if (isAdminDatabaseError(error)) {
      return createAdminDataResponse(EMPTY_ADMIN_OVERVIEW_STATS);
    }

    return createAdminErrorResponse('Failed to fetch stats', 'INTERNAL_ERROR');
  }
}
