// ============================================
// MOMENTIQUE - Supervisor User Actions API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/db';

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
        const { role } = body;

        if (!role || !['guest', 'organizer', 'super_admin'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        const db = getTenantDb(auth.user.tenant_id);

        await db.query(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
            [role, userId]
        );

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

        await db.query('DELETE FROM users WHERE id = $1', [userId]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[SUPERVISOR_USER_DELETE] Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete user', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
