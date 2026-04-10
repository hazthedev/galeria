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
  getAdminEventActionState,
  isAdminEventStatus,
  isAdminEventUploadsEnabled,
  updateAdminEventStatus,
  updateAdminEventUploadAvailability,
} from '@/lib/services/admin/events';

const eventActionTypes = ['set_status', 'enable_uploads', 'disable_uploads'] as const;
type EventActionType = (typeof eventActionTypes)[number];
const eventStatusValues = ['draft', 'active', 'ended', 'archived'] as const;

const statusMetadataSchema = z.object({
  status: z.enum(eventStatusValues),
});

export const runtime = 'nodejs';

function getStepUpToken(metadata: Record<string, unknown>): string | undefined {
  const token = metadata.step_up_token;
  return typeof token === 'string' && token.trim().length > 0 ? token.trim() : undefined;
}

function requiresStepUp(action: EventActionType) {
  return action === 'set_status' || action === 'disable_uploads';
}

function isReasonRequired(_action: EventActionType) {
  return true;
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
    const eventId = params['eventId'];
    const envelope = parseAdminActionEnvelope(await request.json(), eventActionTypes);

    if (!envelope.success) {
      return createAdminErrorResponse(envelope.error, 'VALIDATION_ERROR', 400, {
        allowedActions: eventActionTypes,
      });
    }

    if (isReasonRequired(envelope.data.action) && !hasAdminActionReason(envelope.data.reason)) {
      return createAdminErrorResponse('A reason is required for this action', 'VALIDATION_ERROR', 400);
    }

    const currentEvent = await getAdminEventActionState(eventId);
    if (!currentEvent) {
      return createAdminErrorResponse('Event not found', 'NOT_FOUND', 404);
    }

    if (requiresStepUp(envelope.data.action)) {
      await requireAdminStepUpIfEnabled({
        adminUserId: access.auth.user.id,
        tenantId: access.auth.user.tenant_id,
        token: getStepUpToken(envelope.data.metadata),
      });
    }

    const uploadsEnabled = isAdminEventUploadsEnabled(currentEvent.settings);

    switch (envelope.data.action) {
      case 'set_status': {
        const metadata = statusMetadataSchema.safeParse(envelope.data.metadata);
        if (!metadata.success || !isAdminEventStatus(metadata.data.status)) {
          return createAdminErrorResponse('Invalid status metadata', 'VALIDATION_ERROR', 400);
        }

        if (metadata.data.status === currentEvent.status) {
          return createAdminErrorResponse('Event already has that status', 'VALIDATION_ERROR', 400);
        }

        const updatedEvent = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'event.status_changed',
          {
            targetId: eventId,
            targetType: 'event',
            reason: envelope.data.reason,
            getOldValues: () => ({
              status: currentEvent.status,
            }),
            getNewValues: (result) => ({
              status: result?.status ?? metadata.data.status,
            }),
          },
          () => updateAdminEventStatus(eventId, metadata.data.status)
        );

        return createAdminDataResponse(updatedEvent);
      }

      case 'enable_uploads': {
        if (uploadsEnabled) {
          return createAdminErrorResponse('Uploads are already enabled', 'VALIDATION_ERROR', 400);
        }

        const updatedEvent = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'event.uploads_enabled',
          {
            targetId: eventId,
            targetType: 'event',
            reason: envelope.data.reason,
            getOldValues: () => ({
              photo_upload_enabled: false,
            }),
            getNewValues: (result) => ({
              photo_upload_enabled: result?.uploads_enabled ?? true,
            }),
          },
          () => updateAdminEventUploadAvailability(eventId, true)
        );

        return createAdminDataResponse(updatedEvent);
      }

      case 'disable_uploads': {
        if (!uploadsEnabled) {
          return createAdminErrorResponse('Uploads are already disabled', 'VALIDATION_ERROR', 400);
        }

        const updatedEvent = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'event.uploads_disabled',
          {
            targetId: eventId,
            targetType: 'event',
            reason: envelope.data.reason,
            getOldValues: () => ({
              photo_upload_enabled: true,
            }),
            getNewValues: (result) => ({
              photo_upload_enabled: result?.uploads_enabled ?? false,
            }),
          },
          () => updateAdminEventUploadAvailability(eventId, false)
        );

        return createAdminDataResponse(updatedEvent);
      }

      default:
        return createAdminErrorResponse('Unsupported action', 'VALIDATION_ERROR', 400);
    }
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

    console.error('[ADMIN_EVENT_ACTIONS] Error:', error);
    return createAdminErrorResponse('Failed to process event action', 'INTERNAL_ERROR');
  }
}
