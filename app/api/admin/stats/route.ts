// ============================================
// Galeria - Supervisor Stats API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';

const isMissingTableError = (error: unknown) =>
    (error as { code?: string })?.code === '42P01';
const isDatabaseError = (error: unknown) =>
    Boolean((error as { code?: string })?.code) ||
    (error instanceof Error && /ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ENOTFOUND/i.test(error.message));

export async function GET(request: NextRequest) {
    try {
        // Require supervisor role
        const auth = await requireSuperAdmin(request);
        if (auth instanceof NextResponse) {
            return auth;
        }

        const db = getTenantDb(SYSTEM_TENANT_ID);

        const safeCount = async (query: string) => {
            try {
                const result = await db.query(query);
                return Number(result.rows[0]?.count || 0);
            } catch (error) {
                if (isMissingTableError(error)) return 0;
                throw error;
            }
        };

        const [
            totalUsers,
            totalEvents,
            totalPhotos,
            totalTenants,
            activeEvents,
            recentUsers,
            mfaEnabledUsers,
            totalLuckyDraws,
            totalWinners,
            pendingPhotos,
        ] = await Promise.all([
            safeCount('SELECT COUNT(*) as count FROM users'),
            safeCount('SELECT COUNT(*) as count FROM events'),
            safeCount('SELECT COUNT(*) as count FROM photos'),
            safeCount('SELECT COUNT(*) as count FROM tenants'),
            safeCount("SELECT COUNT(*) as count FROM events WHERE status = 'active'"),
            safeCount("SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '7 days'"),
            safeCount("SELECT COUNT(*) as count FROM users WHERE totp_enabled = true"),
            safeCount('SELECT COUNT(*) as count FROM lucky_draw_configs'),
            safeCount('SELECT COUNT(*) as count FROM lucky_draw_winners'),
            safeCount("SELECT COUNT(*) as count FROM photos WHERE moderation_status = 'pending'"),
        ]);

        return NextResponse.json({
            data: {
                totalUsers,
                totalEvents,
                totalPhotos,
                totalTenants,
                activeEvents,
                recentUsers,
                mfaEnabledUsers,
                totalLuckyDraws,
                totalWinners,
                pendingPhotos,
            },
        });
    } catch (error) {
        console.error('[SUPERVISOR_STATS] Error:', error);
        if (isDatabaseError(error)) {
            return NextResponse.json({
                data: {
                    totalUsers: 0,
                    totalEvents: 0,
                    totalPhotos: 0,
                    totalTenants: 0,
                    activeEvents: 0,
                    recentUsers: 0,
                    mfaEnabledUsers: 0,
                    totalLuckyDraws: 0,
                    totalWinners: 0,
                    pendingPhotos: 0,
                },
            });
        }
        return NextResponse.json(
            { error: 'Failed to fetch stats', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}