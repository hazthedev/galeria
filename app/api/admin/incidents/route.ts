import { NextRequest, NextResponse } from 'next/server';

import {
  createAdminDataResponse,
  createAdminErrorResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { isAdminDatabaseError } from '@/lib/domain/admin/context';
import { getAdminIncidents, getEmptyAdminIncidentsData } from '@/lib/services/admin/incidents';

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const data = await getAdminIncidents();
    return createAdminDataResponse(data);
  } catch (error) {
    console.error('[ADMIN_INCIDENTS_GET] Error:', error);

    if (isAdminDatabaseError(error)) {
      return createAdminDataResponse(getEmptyAdminIncidentsData());
    }

    return createAdminErrorResponse('Failed to load incidents workspace', 'INTERNAL_ERROR');
  }
}
