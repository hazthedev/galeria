import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

import {
  createAdminDataResponse,
  createAdminErrorResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { requireAdminStepUpIfEnabled } from '@/lib/domain/admin/step-up';
import {
  hasAdminActionReason,
  parseAdminActionEnvelope,
} from '@/lib/domain/admin/action-envelope';
import { withAuditLog } from '@/lib/audit/middleware';
import {
  deleteAdminUser,
  disableAdminUserMfa,
  getAdminUserById,
  sendAdminUserPasswordResetEmail,
  updateAdminUserRole,
  updateAdminUserSubscriptionTier,
  type AdminUserRole,
} from '@/lib/services/admin/users';
import { terminateAdminSessions } from '@/lib/services/admin/sessions';
import type { SubscriptionTier } from '@/lib/types';

const userActionTypes = [
  'change_role',
  'change_tier',
  'delete_user',
  'revoke_session',
  'revoke_all_sessions',
  'disable_mfa',
  'send_password_reset',
] as const;
type UserActionType = (typeof userActionTypes)[number];

const roleMetadataSchema = z.object({
  role: z.enum(['guest', 'organizer', 'super_admin']),
});

const tierMetadataSchema = z.object({
  subscription_tier: z.enum(['free', 'pro', 'premium', 'enterprise', 'tester']),
});

const revokeSessionMetadataSchema = z.object({
  session_id: z.string().trim().min(1),
});

export const runtime = 'nodejs';

function getStepUpToken(metadata: Record<string, unknown>): string | undefined {
  const token = metadata.step_up_token;
  return typeof token === 'string' && token.trim().length > 0 ? token.trim() : undefined;
}

function isReasonRequired(action: UserActionType): boolean {
  return (
    action === 'change_role' ||
    action === 'change_tier' ||
    action === 'delete_user' ||
    action === 'revoke_session' ||
    action === 'revoke_all_sessions'
  );
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
    const envelope = parseAdminActionEnvelope(await request.json(), userActionTypes);

    if (!envelope.success) {
      return createAdminErrorResponse(envelope.error, 'VALIDATION_ERROR', 400, {
        allowedActions: userActionTypes,
      });
    }

    if (isReasonRequired(envelope.data.action) && !hasAdminActionReason(envelope.data.reason)) {
      return createAdminErrorResponse('A reason is required for this action', 'VALIDATION_ERROR', 400);
    }

    const currentUser = await getAdminUserById(userId);
    if (!currentUser) {
      return createAdminErrorResponse('User not found', 'NOT_FOUND', 404);
    }

    switch (envelope.data.action) {
      case 'change_role': {
        const metadata = roleMetadataSchema.safeParse(envelope.data.metadata);
        if (!metadata.success) {
          return createAdminErrorResponse('Invalid role metadata', 'VALIDATION_ERROR', 400);
        }

        if (userId === access.auth.user.id && metadata.data.role !== 'super_admin') {
          return createAdminErrorResponse(
            'Cannot demote yourself from super_admin role',
            'VALIDATION_ERROR',
            403
          );
        }

        const updatedUser = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'user.role_changed',
          {
            targetId: userId,
            targetType: 'user',
            reason: envelope.data.reason,
            getOldValues: () => ({
              role: currentUser.role,
            }),
            getNewValues: (result) => ({
              role: result.role,
            }),
          },
          () => updateAdminUserRole(userId, metadata.data.role as AdminUserRole)
        );

        return createAdminDataResponse(updatedUser);
      }

      case 'change_tier': {
        const metadata = tierMetadataSchema.safeParse(envelope.data.metadata);
        if (!metadata.success) {
          return createAdminErrorResponse('Invalid tier metadata', 'VALIDATION_ERROR', 400);
        }

        const result = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'user.tier_changed',
          {
            targetId: currentUser.role === 'super_admin' ? userId : currentUser.tenant_id,
            targetType: currentUser.role === 'super_admin' ? 'user' : 'tenant',
            reason: envelope.data.reason,
            getOldValues: () => ({
              subscription_tier: currentUser.subscription_tier ?? null,
            }),
            getNewValues: (updated) => ({
              subscription_tier: updated.subscription_tier,
            }),
          },
          () =>
            updateAdminUserSubscriptionTier(
              currentUser,
              metadata.data.subscription_tier as SubscriptionTier
            )
        );

        return createAdminDataResponse(result);
      }

      case 'delete_user': {
        if (userId === access.auth.user.id) {
          return createAdminErrorResponse('Cannot delete yourself', 'VALIDATION_ERROR', 403);
        }

        await requireAdminStepUpIfEnabled({
          adminUserId: access.auth.user.id,
          tenantId: access.auth.user.tenant_id,
          token: getStepUpToken(envelope.data.metadata),
        });

        const result = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'user.deleted',
          {
            targetId: userId,
            targetType: 'user',
            reason: envelope.data.reason,
            getOldValues: () => ({
              email: currentUser.email,
              role: currentUser.role,
            }),
            getNewValues: () => ({
              deleted: true,
            }),
          },
          async () => {
            await deleteAdminUser(userId);
            return {
              deleted: true,
              userId,
            };
          }
        );

        return createAdminDataResponse(result);
      }

      case 'revoke_session': {
        const metadata = revokeSessionMetadataSchema.safeParse(envelope.data.metadata);
        if (!metadata.success) {
          return createAdminErrorResponse('Invalid session metadata', 'VALIDATION_ERROR', 400);
        }

        const result = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'session.revoked',
          {
            targetId: metadata.data.session_id,
            targetType: 'session',
            reason: envelope.data.reason,
            getOldValues: () => ({
              user_id: userId,
              session_id: metadata.data.session_id,
            }),
            getNewValues: () => ({
              revoked: true,
              terminated_count: 1,
            }),
          },
          () =>
            terminateAdminSessions({
              sessionId: metadata.data.session_id,
              cookie: request.headers.get('cookie'),
              authorization: request.headers.get('authorization'),
            })
        );

        return createAdminDataResponse(result);
      }

      case 'revoke_all_sessions': {
        await requireAdminStepUpIfEnabled({
          adminUserId: access.auth.user.id,
          tenantId: access.auth.user.tenant_id,
          token: getStepUpToken(envelope.data.metadata),
        });

        const result = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'session.all_revoked',
          {
            targetId: userId,
            targetType: 'session',
            reason: envelope.data.reason,
            getOldValues: () => ({
              user_id: userId,
              all_except_current: true,
            }),
            getNewValues: (revoked) => ({
              user_id: userId,
              all_except_current: true,
              terminated_count: revoked.terminatedCount,
            }),
          },
          () =>
            terminateAdminSessions({
              userId,
              allExceptCurrent: true,
              cookie: request.headers.get('cookie'),
              authorization: request.headers.get('authorization'),
            })
        );

        return createAdminDataResponse(result);
      }

      case 'disable_mfa': {
        if (!currentUser.totp_enabled) {
          return createAdminErrorResponse('MFA is not enabled for this user', 'VALIDATION_ERROR', 400);
        }

        await requireAdminStepUpIfEnabled({
          adminUserId: access.auth.user.id,
          tenantId: access.auth.user.tenant_id,
          token: getStepUpToken(envelope.data.metadata),
        });

        const result = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'user.mfa_disabled',
          {
            targetId: userId,
            targetType: 'user',
            reason: envelope.data.reason,
            getOldValues: () => ({
              totp_enabled: currentUser.totp_enabled,
            }),
            getNewValues: (updated) => ({
              totp_enabled: updated.totp_enabled,
            }),
          },
          () => disableAdminUserMfa(userId)
        );

        return createAdminDataResponse(result);
      }

      case 'send_password_reset': {
        const requestOrigin = new URL(request.url).origin;
        const result = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'user.password_reset',
          {
            targetId: userId,
            targetType: 'user',
            reason: envelope.data.reason,
            getOldValues: () => ({
              email: currentUser.email,
            }),
            getNewValues: () => ({
              reset_email_sent: true,
            }),
          },
          () =>
            sendAdminUserPasswordResetEmail({
              email: currentUser.email,
              redirectBaseUrl: requestOrigin,
            })
        );

        return createAdminDataResponse(result);
      }

      default:
        return createAdminErrorResponse('Unsupported action', 'VALIDATION_ERROR', 400);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'AUTH_NOT_CONFIGURED') {
        return createAdminErrorResponse(
          'Password reset is not configured on the server',
          'AUTH_NOT_CONFIGURED',
          503
        );
      }
      if (error.message === 'NO_SESSION') {
        return createAdminErrorResponse('No active session found', 'VALIDATION_ERROR', 400);
      }
      if (error.message === 'CANNOT_TERMINATE_SELF') {
        return createAdminErrorResponse(
          'Cannot terminate your own current session from this action',
          'VALIDATION_ERROR',
          400
        );
      }
      if (error.message === 'NOT_FOUND') {
        return createAdminErrorResponse('Session not found or already expired', 'NOT_FOUND', 404);
      }
      if (error.message === 'VALIDATION_ERROR') {
        return createAdminErrorResponse('Invalid session action', 'VALIDATION_ERROR', 400);
      }
      if (error.message === 'STEP_UP_REQUIRED') {
        return createAdminErrorResponse(
          'Enter your current MFA code to continue',
          'STEP_UP_REQUIRED',
          403
        );
      }
      if (error.message === 'STEP_UP_INVALID') {
        return createAdminErrorResponse('Invalid MFA code', 'STEP_UP_INVALID', 403);
      }
      if (error.message === 'ADMIN_NOT_FOUND') {
        return createAdminErrorResponse('Admin user not found', 'NOT_FOUND', 404);
      }
    }

    console.error('[ADMIN_USER_ACTIONS] Error:', error);
    return createAdminErrorResponse('Failed to process user action', 'INTERNAL_ERROR');
  }
}
