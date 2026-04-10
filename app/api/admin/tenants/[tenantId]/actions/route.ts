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
  getAdminTenantById,
  isSystemTenantId,
  updateAdminTenantStatus,
  updateAdminTenantSubscriptionTier,
} from '@/lib/services/admin/tenants';
import type { SubscriptionTier } from '@/lib/types';

const tenantActionTypes = ['suspend_tenant', 'activate_tenant', 'change_tier'] as const;
type TenantActionType = (typeof tenantActionTypes)[number];

const changeTierMetadataSchema = z.object({
  subscription_tier: z.enum(['free', 'pro', 'premium', 'enterprise', 'tester']),
});

export const runtime = 'nodejs';

function getStepUpToken(metadata: Record<string, unknown>): string | undefined {
  const token = metadata.step_up_token;
  return typeof token === 'string' && token.trim().length > 0 ? token.trim() : undefined;
}

function isReasonRequired(action: TenantActionType): boolean {
  return action === 'suspend_tenant' || action === 'change_tier';
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
    const tenantId = params['tenantId'];

    if (isSystemTenantId(tenantId)) {
      return createAdminErrorResponse('Cannot modify system tenant', 'VALIDATION_ERROR', 403);
    }

    const envelope = parseAdminActionEnvelope(await request.json(), tenantActionTypes);
    if (!envelope.success) {
      return createAdminErrorResponse(envelope.error, 'VALIDATION_ERROR', 400, {
        allowedActions: tenantActionTypes,
      });
    }

    if (isReasonRequired(envelope.data.action) && !hasAdminActionReason(envelope.data.reason)) {
      return createAdminErrorResponse('A reason is required for this action', 'VALIDATION_ERROR', 400);
    }

    const currentTenant = await getAdminTenantById(tenantId);
    if (!currentTenant) {
      return createAdminErrorResponse('Tenant not found', 'NOT_FOUND', 404);
    }

    switch (envelope.data.action) {
      case 'suspend_tenant': {
        await requireAdminStepUpIfEnabled({
          adminUserId: access.auth.user.id,
          tenantId: access.auth.user.tenant_id,
          token: getStepUpToken(envelope.data.metadata),
        });

        const updatedTenant = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'tenant.suspended',
          {
            targetId: tenantId,
            targetType: 'tenant',
            reason: envelope.data.reason,
            getOldValues: () => ({
              status: currentTenant.status,
            }),
            getNewValues: (result) => ({
              status: result.status,
            }),
          },
          () => updateAdminTenantStatus(tenantId, 'suspended')
        );

        return createAdminDataResponse(updatedTenant);
      }

      case 'activate_tenant': {
        const updatedTenant = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'tenant.activated',
          {
            targetId: tenantId,
            targetType: 'tenant',
            reason: envelope.data.reason,
            getOldValues: () => ({
              status: currentTenant.status,
            }),
            getNewValues: (result) => ({
              status: result.status,
            }),
          },
          () => updateAdminTenantStatus(tenantId, 'active')
        );

        return createAdminDataResponse(updatedTenant);
      }

      case 'change_tier': {
        const metadata = changeTierMetadataSchema.safeParse(envelope.data.metadata);
        if (!metadata.success) {
          return createAdminErrorResponse('Invalid tier metadata', 'VALIDATION_ERROR', 400);
        }

        const updatedTenant = await withAuditLog(
          request,
          access.auth.user,
          access.auth.session,
          'tenant.plan_changed',
          {
            targetId: tenantId,
            targetType: 'tenant',
            reason: envelope.data.reason,
            getOldValues: () => ({
              subscription_tier: currentTenant.subscription_tier,
            }),
            getNewValues: (result) => ({
              subscription_tier: result.subscription_tier,
            }),
          },
          () =>
            updateAdminTenantSubscriptionTier(
              tenantId,
              metadata.data.subscription_tier as SubscriptionTier
            )
        );

        return createAdminDataResponse(updatedTenant);
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

    console.error('[ADMIN_TENANT_ACTIONS] Error:', error);
    return createAdminErrorResponse('Failed to process tenant action', 'INTERNAL_ERROR');
  }
}
