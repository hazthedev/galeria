// ============================================
// Galeria - Admin Audit Middleware
// ============================================
// Middleware wrapper for automatically logging admin actions

import type { NextRequest } from 'next/server';
import { logAdminAction, type AuditAction } from './index';
import type { IUser, ISessionData } from '@/lib/types';

// ============================================
// TYPES
// ============================================

export interface WithAuditLogOptions<T = unknown> {
  request: NextRequest;
  admin: IUser;
  session: ISessionData;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  getOldValues?: () => Record<string, unknown> | Promise<Record<string, unknown>>;
  getNewValues?: (result: T) => Record<string, unknown> | Promise<Record<string, unknown>>;
  reason?: string;
  includeFailure?: boolean; // Whether to log failed attempts (default: true)
}

export interface AuditLogContext {
  admin: IUser;
  session: ISessionData;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// FUNCTIONS
// ============================================

/**
 * Wrap an admin action with automatic audit logging
 *
 * @example
 * const result = await withAuditLog(
 *   request,
 *   admin,
 *   session,
 *   'user.role_changed',
 *   { targetId: userId, targetType: 'user' },
 *   async () => {
 *     // Perform the actual action
 *     await db.update('users', { role: newRole }, { id: userId });
 *     return { success: true, role: newRole };
 *   },
 *   {
 *     getOldValues: () => ({ role: oldRole }),
 *     getNewValues: (result) => ({ role: result.role }),
 *   }
 * );
 */
export async function withAuditLog<T>(
  request: NextRequest,
  admin: IUser,
  session: ISessionData,
  action: AuditAction,
  options: {
    targetId?: string;
    targetType?: string;
    reason?: string;
    getOldValues?: () => Record<string, unknown> | Promise<Record<string, unknown>>;
    getNewValues?: (result: T) => Record<string, unknown> | Promise<Record<string, unknown>>;
    includeFailure?: boolean;
  },
  fn: () => Promise<T>
): Promise<T> {
  const oldValues = options.getOldValues
    ? await options.getOldValues()
    : undefined;

  try {
    const result = await fn();

    // Log successful action
    const newValues = options.getNewValues
      ? await options.getNewValues(result)
      : undefined;

    await logAdminAction({
      adminId: admin.id,
      action,
      targetId: options.targetId,
      targetType: options.targetType as any,
      oldValues,
      newValues,
      reason: options.reason,
      ipAddress: extractIpAddressFromRequest(request),
      userAgent: extractUserAgentFromRequest(request),
    });

    return result;
  } catch (error) {
    // Log failed action if enabled
    if (options.includeFailure !== false) {
      await logAdminAction({
        adminId: admin.id,
        action: `${action}.failed` as AuditAction,
        targetId: options.targetId,
        targetType: options.targetType as any,
        oldValues,
        newValues: {
          error: error instanceof Error ? error.message : String(error),
        },
        reason: options.reason,
        ipAddress: extractIpAddressFromRequest(request),
        userAgent: extractUserAgentFromRequest(request),
      });
    }
    throw error;
  }
}

/**
 * Extract IP address from NextRequest
 */
function extractIpAddressFromRequest(request: NextRequest): string | undefined {
  // Check various headers for IP address (order matters for priority)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    undefined
  );
}

/**
 * Extract user agent from NextRequest
 */
function extractUserAgentFromRequest(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Higher-order function that adds audit logging to any async function
 *
 * @example
 * const deleteUser = withAuditLogging(
 *   'user.deleted',
 *   (userId: string, request: NextRequest, admin: IUser) => {
 *     // Delete logic here
 *   }
 * );
 */
export function withAuditLogging<
  Args extends unknown[],
  T = unknown
>(
  action: AuditAction,
  fn: (
    ...args: Args
  ) => Promise<T>,
  options?: {
    getTargetId?: (...args: Args) => string;
    getTargetType?: (...args: Args) => string;
    getOldValues?: (...args: Args) => Record<string, unknown>;
    getNewValues?: (result: T, ...args: Args) => Record<string, unknown>;
    includeFailure?: boolean;
  }
) {
  return async (
    ...args: [...Args, NextRequest, IUser, ISessionData]
  ): Promise<T> => {
    const [request, admin, session] = args.slice(-3) as [
      NextRequest,
      IUser,
      ISessionData
    ];
    const fnArgs = args.slice(0, -3) as Args;

    const targetId = options?.getTargetId?.(...fnArgs);
    const targetType = options?.getTargetType?.(...fnArgs);
    const oldValues = options?.getOldValues?.(...fnArgs);

    try {
      const result = await fn(...fnArgs);

      const newValues = options?.getNewValues?.(result, ...fnArgs);

      await logAdminAction({
        adminId: admin.id,
        action,
        targetId,
        targetType: targetType as any,
        oldValues,
        newValues,
        ipAddress: extractIpAddressFromRequest(request),
        userAgent: extractUserAgentFromRequest(request),
      });

      return result;
    } catch (error) {
      if (options?.includeFailure !== false) {
        await logAdminAction({
          adminId: admin.id,
          action: `${action}.failed` as AuditAction,
          targetId,
          targetType: targetType as any,
          oldValues,
          newValues: {
            error: error instanceof Error ? error.message : String(error),
          },
          ipAddress: extractIpAddressFromRequest(request),
          userAgent: extractUserAgentFromRequest(request),
        });
      }
      throw error;
    }
  };
}

/**
 * Create an audit log entry for a simple action (no old/new values needed)
 */
export async function logSimpleAdminAction(
  request: NextRequest,
  admin: IUser,
  action: AuditAction,
  options?: {
    targetId?: string;
    targetType?: string;
    reason?: string;
  }
): Promise<void> {
  await logAdminAction({
    adminId: admin.id,
    action,
    targetId: options?.targetId,
    targetType: options?.targetType as any,
    reason: options?.reason,
    ipAddress: extractIpAddressFromRequest(request),
    userAgent: extractUserAgentFromRequest(request),
  });
}
