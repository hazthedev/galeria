import { type NextRequest, NextResponse } from 'next/server';

import { requireSuperAdmin } from '@/middleware/auth';
import { getAdminDb } from '@/lib/domain/admin/context';

export type AdminApiErrorCode =
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'DATABASE_UNAVAILABLE'
  | 'AUTH_NOT_CONFIGURED'
  | 'STEP_UP_REQUIRED'
  | 'STEP_UP_INVALID';

export async function requireAdminRouteAccess(request: NextRequest) {
  const auth = await requireSuperAdmin(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  return {
    auth,
    db: getAdminDb(),
  };
}

export function createAdminDataResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function createAdminPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  init?: ResponseInit
) {
  return NextResponse.json({ data, pagination }, init);
}

export function createAdminErrorResponse(
  error: string,
  code: AdminApiErrorCode,
  status: number = 500,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    details ? { error, code, details } : { error, code },
    { status }
  );
}
