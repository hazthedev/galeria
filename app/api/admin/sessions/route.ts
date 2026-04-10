// ============================================
// Galeria - Admin Sessions API
// ============================================
// Super admin endpoints for managing user sessions

import { NextRequest, NextResponse } from 'next/server';

import { logSimpleAdminAction } from '@/lib/audit/middleware';
import {
  createAdminDataResponse,
  createAdminErrorResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { listAdminSessions, terminateAdminSessions } from '@/lib/services/admin/sessions';

/**
 * GET /api/admin/sessions
 * List all sessions or filter by user
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includeExpired = searchParams.get('includeExpired') === 'true';

    const result = await listAdminSessions({
      userId,
      includeExpired,
      cookie: request.headers.get('cookie'),
      authorization: request.headers.get('authorization'),
    });

    return createAdminDataResponse(result);
  } catch (error) {
    console.error('[ADMIN_SESSIONS_GET] Error:', error);
    return createAdminErrorResponse('Failed to load sessions', 'INTERNAL_ERROR');
  }
}

/**
 * DELETE /api/admin/sessions
 * Terminate specific session(s) or all sessions for a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const body = await request.json();
    const { sessionId, userId, allExceptCurrent = false } = body;

    const result = await terminateAdminSessions({
      sessionId,
      userId,
      allExceptCurrent,
      cookie: request.headers.get('cookie'),
      authorization: request.headers.get('authorization'),
    });

    await logSimpleAdminAction(
      request,
      access.auth.user,
      sessionId ? 'session.revoked' : 'session.all_revoked',
      {
        targetType: 'session',
        targetId: sessionId || userId,
        reason: sessionId
          ? `Revoked session ${sessionId}`
          : `Revoked ${result.terminatedCount} sessions for user ${userId}`,
      }
    );

    return createAdminDataResponse({
      success: true,
      terminatedCount: result.terminatedCount,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NO_SESSION') {
        return createAdminErrorResponse('No active session found', 'VALIDATION_ERROR', 400);
      }
      if (error.message === 'CANNOT_TERMINATE_SELF') {
        return createAdminErrorResponse(
          'Cannot terminate your own session via this endpoint',
          'VALIDATION_ERROR',
          400
        );
      }
      if (error.message === 'NOT_FOUND') {
        return createAdminErrorResponse('Session not found or already expired', 'NOT_FOUND', 404);
      }
      if (error.message === 'VALIDATION_ERROR') {
        return createAdminErrorResponse(
          'Must specify sessionId or userId',
          'VALIDATION_ERROR',
          400
        );
      }
    }

    console.error('[ADMIN_SESSIONS_DELETE] Error:', error);
    return createAdminErrorResponse('Failed to terminate session(s)', 'INTERNAL_ERROR');
  }
}
