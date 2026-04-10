import { type NextRequest, NextResponse } from 'next/server';

import {
  createAdminDataResponse,
  createAdminErrorResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { isAdminDatabaseError } from '@/lib/domain/admin/context';
import {
  normalizeAdminSearchQuery,
  parseAdminSearchLimit,
  parseAdminSearchTypes,
} from '@/lib/domain/admin/search';
import { EMPTY_ADMIN_SEARCH_COUNTS } from '@/lib/domain/admin/types';
import { searchAdminEntities } from '@/lib/services/admin/search';

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const { searchParams } = new URL(request.url);
    const query = normalizeAdminSearchQuery(searchParams.get('q'));
    const limit = parseAdminSearchLimit(searchParams.get('limit'));
    const types = parseAdminSearchTypes(searchParams.get('types'));

    if (!query) {
      return createAdminDataResponse({
        query,
        results: [],
        counts: { ...EMPTY_ADMIN_SEARCH_COUNTS },
        limit,
      });
    }

    const results = await searchAdminEntities(query, {
      limit,
      types,
    });

    return createAdminDataResponse(results);
  } catch (error) {
    console.error('[ADMIN_SEARCH] Error:', error);

    if (isAdminDatabaseError(error)) {
      return createAdminDataResponse({
        query: '',
        results: [],
        counts: { ...EMPTY_ADMIN_SEARCH_COUNTS },
        limit: parseAdminSearchLimit(null),
      });
    }

    return createAdminErrorResponse('Failed to search admin entities', 'INTERNAL_ERROR');
  }
}
