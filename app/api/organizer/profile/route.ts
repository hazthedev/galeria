// ============================================
// GALERIA - Organizer Profile API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { deleteUserSessions } from '@/lib/domain/auth/session';
import bcrypt from 'bcrypt';

/**
 * PATCH /api/organizer/profile
 * Update organizer's name and/or password
 */
export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) {
            return auth;
        }

        const body = (await request.json()) as { name?: string; password?: string };
        const { name, password } = body;

        // Validation
        if (!name && !password) {
            return NextResponse.json(
                { error: 'No changes provided', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        if (password && password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        const db = getTenantDb(auth.user.tenant_id);
        const updates: string[] = [];
        const values: string[] = [];
        let paramIndex = 1;

        if (name) {
            updates.push(`name = $${paramIndex}`);
            values.push(name);
            paramIndex++;
        }

        if (password) {
            const passwordHash = await bcrypt.hash(password, 12);
            updates.push(`password_hash = $${paramIndex}`);
            values.push(passwordHash);
            paramIndex++;
        }

        // Add user ID as the last parameter
        values.push(auth.user.id);

        if (updates.length > 0) {
            await db.query(
                `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
                values
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[ORGANIZER_PROFILE_PATCH] Error:', error);
        return NextResponse.json(
            { error: 'Failed to update profile', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/organizer/profile
 * Delete organizer account and associated personal data
 */
export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) {
            return auth;
        }

        const db = getTenantDb(auth.user.tenant_id);
        const normalizedEmail = auth.user.email.toLowerCase();
        const userId = auth.user.id;

        await db.transact(async (client) => {
            await client.query(
                'DELETE FROM photo_reactions WHERE user_id = $1',
                [userId]
            ).catch(() => undefined);

            await client.query(
                'DELETE FROM prize_claims WHERE user_fingerprint = $1',
                [userId]
            );

            await client.query(
                'DELETE FROM guest_photo_progress WHERE user_fingerprint = $1',
                [userId]
            );

            await client.query(
                'DELETE FROM attendances WHERE user_fingerprint = $1 OR guest_email = $2',
                [userId, normalizedEmail]
            );

            await client.query(
                'DELETE FROM lucky_draw_entries WHERE user_fingerprint = $1',
                [userId]
            );

            await client.query(
                'DELETE FROM photos WHERE user_fingerprint = $1',
                [userId]
            );

            await client.query(
                'DELETE FROM events WHERE organizer_id = $1',
                [userId]
            );

            await client.query(
                'DELETE FROM users WHERE id = $1',
                [userId]
            );
        });

        await deleteUserSessions(userId, auth.user.tenant_id);

        const response = NextResponse.json({ success: true, message: 'Account deleted successfully' });
        response.cookies.set('session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });

        return response;
    } catch (error) {
        console.error('[ORGANIZER_PROFILE_DELETE] Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete account', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
