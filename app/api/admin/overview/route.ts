import { type NextRequest, NextResponse } from 'next/server';

import {
  createAdminDataResponse,
  createAdminErrorResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { isAdminDatabaseError } from '@/lib/domain/admin/context';
import { getEmptyAdminOverviewData, getAdminOverview } from '@/lib/services/admin/overview';

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const { searchParams } = new URL(request.url);
    const activityLimit = Math.max(
      1,
      Math.min(Number.parseInt(searchParams.get('activityLimit') || '10', 10) || 10, 25)
    );

    const overview = await getAdminOverview(activityLimit);
    return createAdminDataResponse(overview);
  } catch (error) {
    console.error('[ADMIN_OVERVIEW] Error:', error);

    if (isAdminDatabaseError(error)) {
      return createAdminDataResponse(getEmptyAdminOverviewData());
    }

    return createAdminErrorResponse('Failed to fetch overview', 'INTERNAL_ERROR');
  }
}
