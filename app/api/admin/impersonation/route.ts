import { NextRequest, NextResponse } from 'next/server';

import { createAdminErrorResponse } from '@/lib/domain/admin/api';
import { withAuditLog } from '@/lib/audit/middleware';
import {
  deleteSession,
  extractSessionId,
  getSession,
  validateSession,
} from '@/lib/domain/auth/session';

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = extractSessionId(
      request.headers.get('cookie'),
      request.headers.get('authorization')
    );

    if (!sessionId) {
      return createAdminErrorResponse('No active session found', 'VALIDATION_ERROR', 400);
    }

    const current = await validateSession(sessionId, false);
    if (!current.valid || !current.session || !current.user) {
      return createAdminErrorResponse('Authentication required', 'VALIDATION_ERROR', 401);
    }

    if (!current.session.impersonation?.readOnly) {
      return createAdminErrorResponse('Support mode is not active', 'VALIDATION_ERROR', 400);
    }

    const actorSessionId = current.session.impersonation.actorSessionId;
    const actorSession = await getSession(actorSessionId);

    await withAuditLog(
      request,
      {
        id: current.session.impersonation.actorUserId,
        tenant_id: current.session.impersonation.actorTenantId,
        email: current.session.impersonation.actorEmail,
        name: current.session.impersonation.actorName,
        role: current.session.impersonation.actorRole,
        email_verified: true,
        created_at: new Date(current.session.impersonation.startedAt),
        updated_at: new Date(),
      },
      {
        userId: current.session.impersonation.actorUserId,
        tenantId: current.session.impersonation.actorTenantId,
        role: current.session.impersonation.actorRole,
        email: current.session.impersonation.actorEmail,
        name: current.session.impersonation.actorName,
        createdAt: current.session.impersonation.startedAt,
        lastActivity: Date.now(),
        expiresAt: Date.now(),
        rememberMe: false,
      },
      'user.impersonation_ended',
      {
        targetId: current.user!.id,
        targetType: 'user',
        reason: 'Read-only support mode ended',
        getOldValues: () => ({
          impersonated_user_id: current.user!.id,
          actor_session_id: actorSessionId,
        }),
        getNewValues: () => ({
          restored_admin_session: Boolean(actorSession),
        }),
      },
      async () => true
    );

    await deleteSession(sessionId);

    const response = NextResponse.json({
      data: {
        restored: Boolean(actorSession),
        redirectTo: actorSession ? '/admin' : '/auth/admin/login',
      },
    });

    if (actorSession) {
      const ttlSeconds = Math.max(60, Math.floor((actorSession.expiresAt - Date.now()) / 1000));
      response.cookies.set('session', actorSessionId, getCookieOptions(ttlSeconds));
    } else {
      response.cookies.set('session', '', getCookieOptions(0));
    }

    return response;
  } catch (error) {
    console.error('[ADMIN_IMPERSONATION_END] Error:', error);
    return createAdminErrorResponse('Failed to end support mode', 'INTERNAL_ERROR');
  }
}
