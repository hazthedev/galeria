// ============================================
// Galeria - Supervisor Users API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';
import { logSimpleAdminAction } from '@/lib/audit/middleware';

export async function GET(request: NextRequest) {
    try {
        const auth = await requireSuperAdmin(request);
        if (auth instanceof NextResponse) {
            return auth;
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
        const role = searchParams.get('role');
        const search = searchParams.get('search');

        const offset = (page - 1) * limit;
        const db = getTenantDb(SYSTEM_TENANT_ID);

        // Build query conditions
        let whereClause = '1=1';
        const params: (string | number)[] = [];
        let paramIndex = 1;

        if (role && role !== 'all') {
            whereClause += ` AND u.role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        if (search) {
            whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex + 1})`;
            params.push(`%${search}%`, `%${search}%`);
            paramIndex += 2;
        }

        // Get users
        const usersResult = await db.query(
            `SELECT
         u.id,
         u.email,
         u.name,
         u.role,
         u.tenant_id,
         CASE
           WHEN u.role = 'super_admin' THEN COALESCE(u.subscription_tier, 'free')
           ELSE COALESCE(t.subscription_tier, u.subscription_tier, 'free')
         END AS subscription_tier,
         u.subscription_tier AS user_subscription_tier,
         t.subscription_tier AS tenant_subscription_tier,
         t.company_name AS tenant_name,
         u.created_at,
         u.last_login_at
       FROM users u
       LEFT JOIN tenants t ON t.id = u.tenant_id
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        // Get total count
        const countResult = await db.query(
            `SELECT COUNT(*) as count FROM users u WHERE ${whereClause}`,
            params
        );

        const total = Number(countResult.rows[0]?.count || 0);

        return NextResponse.json({
            data: usersResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('[SUPERVISOR_USERS] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
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

        // Prevent self-modification in bulk operations
        const selfIndex = userIds.indexOf(auth.user.id);
        const includesSelf = selfIndex !== -1;

        let results = { processed: 0, skipped: 0, errors: 0 };
        let auditAction: string | null = null;
        let auditReason = '';

        switch (action) {
            case 'delete':
                if (includesSelf) {
                    return NextResponse.json(
                        { error: 'Cannot delete yourself in bulk operations', code: 'CANNOT_DELETE_SELF' },
                        { status: 400 }
                    );
                }

                // Get users for audit before deletion
                const usersToDelete = await db.query<{ id: string; email: string; name: string; role: string }>(
                    `SELECT id, email, name, role FROM users WHERE id = ANY($1)`,
                    [userIds]
                );

                // Delete users
                const deleteResult = await db.query(
                    `DELETE FROM users WHERE id = ANY($1) RETURNING id`,
                    [userIds]
                );

                results.processed = deleteResult.rowCount || 0;

                // Log audit trail
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

            case 'updateRole':
                if (!role || !['guest', 'organizer', 'super_admin'].includes(role)) {
                    return NextResponse.json(
                        { error: 'Valid role is required', code: 'VALIDATION_ERROR' },
                        { status: 400 }
                    );
                }

                // Remove self from bulk operations
                const filteredUserIds = includesSelf ? userIds.filter((id: string) => id !== auth.user.id) : userIds;

                if (filteredUserIds.length === 0) {
                    return NextResponse.json(
                        { error: 'No valid users to update (self removed)', code: 'NO_VALID_USERS' },
                        { status: 400 }
                    );
                }

                // Get current roles for audit
                const currentRoles = await db.query<{ id: string; email: string; name: string; role: string }>(
                    `SELECT id, email, name, role FROM users WHERE id = ANY($1)`,
                    [filteredUserIds]
                );

                // Update roles
                const updateResult = await db.query(
                    `UPDATE users SET role = $1, updated_at = NOW() WHERE id = ANY($2) RETURNING id`,
                    [role, filteredUserIds]
                );

                results.processed = updateResult.rowCount || 0;
                results.skipped = includesSelf ? 1 : 0;

                // Log audit trail
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

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Supported: delete, updateRole', code: 'INVALID_ACTION' },
                    { status: 400 }
                );
        }

        // Log bulk action
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
