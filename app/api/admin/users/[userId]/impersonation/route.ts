import { NextRequest, NextResponse } from 'next/server';

import { createAdminErrorResponse, requireAdminRouteAccess } from '@/lib/domain/admin/api';
import { withAuditLog } from '@/lib/audit/middleware';
import { getAdminUserById } from '@/lib/services/admin/users';
import { createSession, extractSessionId } from '@/lib/domain/auth/session';

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 604800,
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const params = await context.params;
    const userId = params['userId'];
    const targetUser = await getAdminUserById(userId);

    if (!targetUser) {
      return createAdminErrorResponse('User not found', 'NOT_FOUND', 404);
    }

    if (targetUser.role !== 'organizer') {
      return createAdminErrorResponse(
        'Support mode is currently limited to organizer accounts',
        'VALIDATION_ERROR',
        400
      );
    }

    if (targetUser.id === access.auth.user.id) {
      return createAdminErrorResponse(
        'You are already signed in as this user',
        'VALIDATION_ERROR',
        400
      );
    }

    const { sessionId: actorSessionId } = extractSessionId(
      request.headers.get('cookie'),
      request.headers.get('authorization')
    );

    if (!actorSessionId) {
      return createAdminErrorResponse('No active admin session found', 'VALIDATION_ERROR', 400);
    }

    const impersonationSessionId = await withAuditLog(
      request,
      access.auth.user,
      access.auth.session,
      'user.impersonation_started',
      {
        targetId: userId,
        targetType: 'user',
        reason: 'Read-only support mode started',
        getOldValues: () => ({
          actor_user_id: access.auth.user.id,
          actor_session_id: actorSessionId,
        }),
        getNewValues: () => ({
          impersonated_user_id: targetUser.id,
          impersonated_role: targetUser.role,
          read_only: true,
        }),
      },
      () =>
        createSession(
          {
            id: targetUser.id,
            tenant_id: targetUser.tenant_id,
            email: targetUser.email,
            name: targetUser.name || targetUser.email,
            role: targetUser.role,
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            rememberMe: false,
            impersonation: {
              actorUserId: access.auth.user.id,
              actorTenantId: access.auth.user.tenant_id,
              actorEmail: access.auth.user.email,
              actorName: access.auth.user.name,
              actorRole: access.auth.user.role,
              actorSessionId,
              startedAt: Date.now(),
              readOnly: true,
            },
          }
        )
    );

    const response = NextResponse.json(
      {
        data: {
          sessionId: impersonationSessionId,
          redirectTo: '/organizer',
        },
      },
      { status: 200 }
    );

    response.cookies.set('session', impersonationSessionId, getCookieOptions());
    return response;
  } catch (error) {
    console.error('[ADMIN_IMPERSONATION_START] Error:', error);
    return createAdminErrorResponse('Failed to start support mode', 'INTERNAL_ERROR');
  }
}
