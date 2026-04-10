import { NextRequest, NextResponse } from 'next/server';

import {
  createAdminErrorResponse,
  createAdminPaginatedResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { listAdminModerationQueue } from '@/lib/services/admin/moderation';

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const search = searchParams.get('search')?.trim() || null;

    const result = await listAdminModerationQueue({
      page,
      limit,
      status,
      source,
      search,
    });

    return createAdminPaginatedResponse(result.items, result.pagination);
  } catch (error) {
    console.error('[ADMIN_MODERATION_GET] Error:', error);
    return createAdminErrorResponse('Failed to load moderation queue', 'INTERNAL_ERROR');
  }
}
