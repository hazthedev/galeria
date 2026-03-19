// ============================================
// Galeria - Supervisor User Actions API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import type { SubscriptionTier } from '@/lib/types';
import { getTierConfig } from '@/lib/tenant';
import { logSimpleAdminAction } from '@/lib/audit/middleware';

type UserTenantLookup = {
    id: string;
    tenant_id: string;
    role: 'guest' | 'organizer' | 'super_admin';
};

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const auth = await requireSuperAdmin(request);
        if (auth instanceof NextResponse) {
            return auth;
        }

        const { userId } = await params;
        const body = await request.json();
        const { role, subscription_tier } = body || {};

        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;
        let nextSubscriptionTier: SubscriptionTier | undefined;

        if (role !== undefined) {
            if (!['guest', 'organizer', 'super_admin'].includes(role)) {
                return NextResponse.json(
                    { error: 'Invalid role', code: 'VALIDATION_ERROR' },
                    { status: 400 }
                );
            }

            // Prevent self-role demotion: admin cannot demote themselves from super_admin
            if (userId === auth.user.id && role !== 'super_admin') {
                return NextResponse.json(
                    { error: 'Cannot demote yourself from super_admin role', code: 'SELF_DEMOTION_FORBIDDEN' },
                    { status: 403 }
                );
            }

            updates.push(`role = $${paramIndex++}`);
            values.push(role);
        }

        if (subscription_tier !== undefined) {
            const validTiers: SubscriptionTier[] = ['free', 'pro', 'premium', 'enterprise', 'tester'];
            if (!validTiers.includes(subscription_tier)) {
                return NextResponse.json(
                    { error: 'Invalid subscription tier', code: 'VALIDATION_ERROR' },
                    { status: 400 }
                );
            }
            nextSubscriptionTier = subscription_tier;
        }

        if (updates.length === 0 && nextSubscriptionTier === undefined) {
            return NextResponse.json(
                { error: 'No changes provided', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        const db = getTenantDb(auth.user.tenant_id);
        const targetUser = await db.findOne<UserTenantLookup>('users', { id: userId });
        if (!targetUser) {
            return NextResponse.json(
                { error: 'User not found', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        // Store old values for audit logging
        const oldValues: Record<string, unknown> = {
            role: targetUser.role,
            subscription_tier: targetUser.role === 'super_admin'
                ? (targetUser as any).subscription_tier
                : undefined,
        };

        // Super admin tier is account-level, organizer/guest tier is tenant-level.
        if (nextSubscriptionTier !== undefined && targetUser.role === 'super_admin') {
            updates.push(`subscription_tier = $${paramIndex++}`);
            values.push(nextSubscriptionTier);
        }

        updates.push('updated_at = NOW()');
        values.push(userId);

        await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            values
        );

        if (nextSubscriptionTier !== undefined && targetUser.role !== 'super_admin') {
            const tierConfig = getTierConfig(nextSubscriptionTier);
            await db.query(
                `UPDATE tenants
                 SET subscription_tier = $1,
                     features_enabled = $2::jsonb,
                     limits = $3::jsonb,
                     updated_at = NOW()
                 WHERE id = $4`,
                [
                    nextSubscriptionTier,
                    JSON.stringify(tierConfig.features),
                    JSON.stringify(tierConfig.limits),
                    targetUser.tenant_id,
                ]
            );
        }

        // Log audit trail for role change
        if (role !== undefined && role !== targetUser.role) {
            await logSimpleAdminAction(
                request,
                auth.user,
                'user.role_changed',
                {
                    targetId: userId,
                    targetType: 'user',
                }
            );
        }

        // Log audit trail for tier change
        if (nextSubscriptionTier !== undefined) {
            await logSimpleAdminAction(
                request,
                auth.user,
                'user.tier_changed',
                {
                    targetId: targetUser.role === 'super_admin' ? userId : targetUser.tenant_id,
                    targetType: targetUser.role === 'super_admin' ? 'user' : 'tenant',
                }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[SUPERVISOR_USER_PATCH] Error:', error);
        return NextResponse.json(
            { error: 'Failed to update user', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const auth = await requireSuperAdmin(request);
        if (auth instanceof NextResponse) {
            return auth;
        }

        const { userId } = await params;
        const db = getTenantDb(auth.user.tenant_id);

        // Prevent self-deletion
        if (userId === auth.user.id) {
            return NextResponse.json(
                { error: 'Cannot delete yourself', code: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        // Get user info for audit before deletion
        const userToDelete = await db.findOne<{ id: string; email: string; name: string; role: string }>(
            'users',
            { id: userId }
        );

        await db.query('DELETE FROM users WHERE id = $1', [userId]);

        // Log audit trail
        await logSimpleAdminAction(
            request,
            auth.user,
            'user.deleted',
            {
                targetId: userId,
                targetType: 'user',
                reason: `Deleted user: ${userToDelete?.email || userId}`,
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[SUPERVISOR_USER_DELETE] Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete user', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
