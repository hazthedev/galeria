// ============================================
// Galeria - Admin Event Detail API
// ============================================
// Super admin endpoints for viewing individual events

import { NextRequest, NextResponse } from 'next/server';

import {
  createAdminDataResponse,
  createAdminErrorResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { getAdminEventDetail } from '@/lib/services/admin/events';

/**
 * GET /api/admin/events/[eventId]
 * Get detailed information about a specific event
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const params = await context.params;
    const eventId = params['eventId'];
    const event = await getAdminEventDetail(eventId);

    if (!event) {
      return createAdminErrorResponse('Event not found', 'NOT_FOUND', 404);
    }

    return createAdminDataResponse(event);
  } catch (error) {
    console.error('[Admin Event Detail API] Failed to load event:', error);
    return createAdminErrorResponse('Failed to load event', 'INTERNAL_ERROR');
  }
}
