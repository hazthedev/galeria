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
  applyAdminModerationAction,
  getAdminModerationPhotoState,
  type AdminModerationAction,
} from '@/lib/services/admin/moderation';

const moderationActionTypes = ['approve_photo', 'reject_photo', 'delete_photo'] as const;

export const runtime = 'nodejs';

function getStepUpToken(metadata: Record<string, unknown>): string | undefined {
  const token = metadata.step_up_token;
  return typeof token === 'string' && token.trim().length > 0 ? token.trim() : undefined;
}

function getAuditAction(action: AdminModerationAction) {
  switch (action) {
    case 'approve_photo':
      return 'photo.approved' as const;
    case 'reject_photo':
      return 'photo.rejected' as const;
    case 'delete_photo':
      return 'photo.deleted' as const;
    default: {
      const exhaustiveCheck: never = action;
      throw new Error(`Unsupported moderation action: ${exhaustiveCheck}`);
    }
  }
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
    const photoId = params['photoId'];
    const envelope = parseAdminActionEnvelope(await request.json(), moderationActionTypes);

    if (!envelope.success) {
      return createAdminErrorResponse(envelope.error, 'VALIDATION_ERROR', 400, {
        allowedActions: moderationActionTypes,
      });
    }

    if (!hasAdminActionReason(envelope.data.reason)) {
      return createAdminErrorResponse('A reason is required for this action', 'VALIDATION_ERROR', 400);
    }

    const currentPhoto = await getAdminModerationPhotoState(photoId);
    if (!currentPhoto) {
      return createAdminErrorResponse('Photo not found', 'NOT_FOUND', 404);
    }

    if (envelope.data.action === 'delete_photo') {
      await requireAdminStepUpIfEnabled({
        adminUserId: access.auth.user.id,
        tenantId: access.auth.user.tenant_id,
        token: getStepUpToken(envelope.data.metadata),
      });
    }

    const result = await withAuditLog(
      request,
      access.auth.user,
      access.auth.session,
      getAuditAction(envelope.data.action),
      {
        targetId: photoId,
        targetType: 'photo',
        reason: envelope.data.reason,
        getOldValues: () => ({
          status: currentPhoto.photo_status,
          event_id: currentPhoto.event_id,
          event_name: currentPhoto.event_name,
          tenant_id: currentPhoto.tenant_id,
        }),
        getNewValues: (outcome) => ({
          previous_status: outcome.previousStatus ?? currentPhoto.photo_status,
          status: outcome.status ?? currentPhoto.photo_status,
          outcome: outcome.outcome,
          event_id: currentPhoto.event_id,
          tenant_id: currentPhoto.tenant_id,
        }),
      },
      () =>
        applyAdminModerationAction({
          action: envelope.data.action,
          photoId,
          tenantId: currentPhoto.tenant_id,
          moderatorId: access.auth.user.id,
          reason: envelope.data.reason,
        })
    );

    if (result.outcome === 'missing') {
      return createAdminErrorResponse('Photo not found', 'NOT_FOUND', 404);
    }

    if (result.outcome === 'skipped') {
      return createAdminErrorResponse(result.message, 'VALIDATION_ERROR', 409, {
        currentStatus: result.status,
      });
    }

    return createAdminDataResponse(result);
  } catch (error) {
    if (error instanceof Error) {
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

    console.error('[ADMIN_MODERATION_ACTIONS] Error:', error);
    return createAdminErrorResponse('Failed to process moderation action', 'INTERNAL_ERROR');
  }
}
