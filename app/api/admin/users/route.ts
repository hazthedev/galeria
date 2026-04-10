// ============================================
// Galeria - Supervisor Users API
// ============================================

import { NextRequest, NextResponse } from 'next/server';

import { requireSuperAdmin } from '@/middleware/auth';
import {
  createAdminErrorResponse,
  createAdminPaginatedResponse,
  requireAdminRouteAccess,
} from '@/lib/domain/admin/api';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';
import { logSimpleAdminAction } from '@/lib/audit/middleware';
import { listAdminUsers } from '@/lib/services/admin/users';

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminRouteAccess(request);
    if (access instanceof NextResponse) {
      return access;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const result = await listAdminUsers({
      page,
      limit,
      role,
      search,
    });

    return createAdminPaginatedResponse(result.items, result.pagination);
  } catch (error) {
    console.error('[SUPERVISOR_USERS] Error:', error);
    return createAdminErrorResponse('Failed to fetch users', 'INTERNAL_ERROR');
  }
}

/**
 * POST /api/admin/users
 * Bulk operations on users (delete, update role, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await request.json();
    const { action, userIds, role } = body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'action and userIds array are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (userIds.length > 100) {
      return NextResponse.json(
        { error: 'Cannot process more than 100 users at once', code: 'TOO_MANY_USERS' },
        { status: 400 }
      );
    }

    const db = getTenantDb(SYSTEM_TENANT_ID);
    const includesSelf = userIds.includes(auth.user.id);

    let results = { processed: 0, skipped: 0, errors: 0 };
    let auditAction: string | null = null;
    let auditReason = '';

    switch (action) {
      case 'delete': {
        if (includesSelf) {
          return NextResponse.json(
            { error: 'Cannot delete yourself in bulk operations', code: 'CANNOT_DELETE_SELF' },
            { status: 400 }
          );
        }

        const usersToDelete = await db.query<{ id: string; email: string }>(
          `SELECT id, email FROM users WHERE id = ANY($1)`,
          [userIds]
        );

        const deleteResult = await db.query(
          `DELETE FROM users WHERE id = ANY($1) RETURNING id`,
          [userIds]
        );

        results.processed = deleteResult.rowCount || 0;

        for (const user of usersToDelete.rows) {
          await logSimpleAdminAction(request, auth.user, 'user.deleted', {
            targetId: user.id,
            targetType: 'user',
            reason: `Bulk deleted user: ${user.email}`,
          });
        }

        auditAction = 'users.bulk_deleted';
        auditReason = `Bulk deleted ${results.processed} users`;
        break;
      }

      case 'updateRole': {
        if (!role || !['guest', 'organizer', 'super_admin'].includes(role)) {
          return NextResponse.json(
            { error: 'Valid role is required', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }

        const filteredUserIds = includesSelf ? userIds.filter((id: string) => id !== auth.user.id) : userIds;

        if (filteredUserIds.length === 0) {
          return NextResponse.json(
            { error: 'No valid users to update (self removed)', code: 'NO_VALID_USERS' },
            { status: 400 }
          );
        }

        const currentRoles = await db.query<{ id: string; email: string; role: string }>(
          `SELECT id, email, role FROM users WHERE id = ANY($1)`,
          [filteredUserIds]
        );

        const updateResult = await db.query(
          `UPDATE users SET role = $1, updated_at = NOW() WHERE id = ANY($2) RETURNING id`,
          [role, filteredUserIds]
        );

        results.processed = updateResult.rowCount || 0;
        results.skipped = includesSelf ? 1 : 0;

        for (const user of currentRoles.rows) {
          await logSimpleAdminAction(request, auth.user, 'user.role_changed', {
            targetId: user.id,
            targetType: 'user',
            reason: `Bulk changed role from ${user.role} to ${role}: ${user.email}`,
          });
        }

        auditAction = 'users.bulk_role_updated';
        auditReason = `Bulk updated ${results.processed} users to role: ${role}`;
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: delete, updateRole', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }

    await logSimpleAdminAction(request, auth.user, auditAction as any, {
      targetType: 'users',
      reason: auditReason,
    });

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[SUPERVISOR_USERS_POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk operation', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
