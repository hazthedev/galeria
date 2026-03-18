// ============================================
// Galeria - Admin MFA Status API
// ============================================
// Get current MFA status for the authenticated admin user

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';

/**
 * GET /api/admin/mfa/status
 * Returns the MFA status for the authenticated admin
 */
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const db = getTenantDb(auth.user.tenant_id);

  const user = await db.findOne<{
    totp_enabled: boolean;
    totp_verified_at: Date | null;
  }>(
    'users',
    { id: auth.user.id }
  );

  if (!user) {
    return NextResponse.json(
      { error: 'User not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: {
      enabled: user.totp_enabled || false,
      verified: user.totp_verified_at !== null,
    },
  });
}
