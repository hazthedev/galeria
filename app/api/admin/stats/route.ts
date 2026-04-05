// ============================================
// Galeria - Supervisor Stats API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';

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

        // Single query to avoid pool exhaustion (session-mode pool_size=1)
        // Core tables only — no optional columns that may not exist yet
        const result = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM users) AS "totalUsers",
                (SELECT COUNT(*) FROM events) AS "totalEvents",
                (SELECT COUNT(*) FROM photos) AS "totalPhotos",
                (SELECT COUNT(*) FROM tenants) AS "totalTenants",
                (SELECT COUNT(*) FROM events WHERE status = 'active') AS "activeEvents",
                (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS "recentUsers",
                (SELECT COUNT(*) FROM lucky_draw_configs) AS "totalLuckyDraws",
                (SELECT COUNT(*) FROM winners) AS "totalWinners",
                (SELECT COUNT(*) FROM photos WHERE status = 'pending') AS "pendingPhotos"
        `);

        const row = result.rows[0] || {};

        // MFA count uses totp_enabled column which may not exist on older schemas
        let mfaEnabledUsers = 0;
        try {
            const mfaResult = await db.query(`SELECT COUNT(*) AS count FROM users WHERE totp_enabled = true`);
            mfaEnabledUsers = Number(mfaResult.rows[0]?.count || 0);
        } catch {
            // Column doesn't exist yet — ignore
        }

        return NextResponse.json({
            data: {
                totalUsers: Number(row.totalUsers || 0),
                totalEvents: Number(row.totalEvents || 0),
                totalPhotos: Number(row.totalPhotos || 0),
                totalTenants: Number(row.totalTenants || 0),
                activeEvents: Number(row.activeEvents || 0),
                recentUsers: Number(row.recentUsers || 0),
                mfaEnabledUsers,
                totalLuckyDraws: Number(row.totalLuckyDraws || 0),
                totalWinners: Number(row.totalWinners || 0),
                pendingPhotos: Number(row.pendingPhotos || 0),
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