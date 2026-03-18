// ============================================
// Galeria - Admin MFA Setup API
// ============================================
// Multi-factor authentication setup endpoints for super admin accounts
// Allows admins to enable TOTP-based 2FA with recovery codes

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import {
  generateTOTPSecret,
  generateTOTPUri,
  generateQRCodeUrl,
  generateRecoveryCodes,
  hashRecoveryCodes,
  verifyTOTP,
} from '@/lib/mfa/totp';
import { logSimpleAdminAction } from '@/lib/audit/middleware';
import crypto from 'crypto';

/**
 * POST /api/admin/mfa/setup
 * Initialize MFA setup by generating a secret and recovery codes
 *
 * Response includes:
 * - secret: The TOTP secret (display only once!)
 * - uri: OTPAUTH URI for authenticator apps
 * - qrCodeUrl: URL to QR code image
 * - recoveryCodes: Plain text recovery codes (display only once!)
 */
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const db = getTenantDb(auth.user.tenant_id);

  // Check if MFA is already enabled
  const user = await db.findOne<{
    id: string;
    totp_enabled: boolean;
    email: string;
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

  if (user.totp_enabled) {
    return NextResponse.json(
      {
        error: 'MFA is already enabled for this account',
        code: 'MFA_ALREADY_ENABLED',
        mfaEnabled: true,
      },
      { status: 400 }
    );
  }

  // Generate TOTP secret and recovery codes
  const secret = generateTOTPSecret(20); // 160 bits = 20 bytes
  const recoveryCodes = generateRecoveryCodes({ count: 10, length: 8 });
  const hashedRecoveryCodes = hashRecoveryCodes(recoveryCodes);

  // Generate TOTP URI for authenticator apps
  const uri = generateTOTPUri({
    issuer: 'Galeria Admin',
    label: user.email,
    secret,
  });

  // Generate QR code URL
  const qrCodeUrl = generateQRCodeUrl(uri, 256);

  // Store secret and hashed codes temporarily (not enabled yet)
  // They will be enabled after the user verifies a code
  await db.query(
    `UPDATE users
     SET totp_secret = $1,
         recovery_codes = $2,
         totp_enabled = false
     WHERE id = $3`,
    [secret, JSON.stringify(hashedRecoveryCodes), auth.user.id]
  );

  // Log the setup initiation
  await logSimpleAdminAction(request, auth.user, 'admin.mfa_setup_initiated', {
    targetId: auth.user.id,
    targetType: 'user',
  });

  return NextResponse.json({
    data: {
      secret,
      uri,
      qrCodeUrl,
      recoveryCodes, // Plain codes - show only once!
      message: 'Save your recovery codes in a safe place. They will not be shown again.',
    },
  });
}

/**
 * PUT /api/admin/mfa/setup
 * Verify TOTP code and enable MFA
 *
 * Body: { token: string }
 *
 * After successful verification, MFA is enabled for the account
 */
export async function PUT(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { token } = body;

  if (!token || typeof token !== 'string') {
    return NextResponse.json(
      { error: 'TOTP token is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // Validate token format (6 digits, optional spaces)
  const cleanToken = token.trim().replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanToken)) {
    return NextResponse.json(
      { error: 'Invalid token format. Must be 6 digits.', code: 'INVALID_TOKEN_FORMAT' },
      { status: 400 }
    );
  }

  const db = getTenantDb(auth.user.tenant_id);

  // Get user's MFA setup
  const user = await db.findOne<{
    id: string;
    totp_secret: string | null;
    totp_enabled: boolean;
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

  if (!user.totp_secret) {
    return NextResponse.json(
      { error: 'MFA setup not initiated. Call POST /api/admin/mfa/setup first.', code: 'MFA_NOT_SETUP' },
      { status: 400 }
    );
  }

  if (user.totp_enabled) {
    return NextResponse.json(
      { error: 'MFA is already enabled', code: 'MFA_ALREADY_ENABLED' },
      { status: 400 }
    );
  }

  // Verify the TOTP token
  if (!verifyTOTP(cleanToken, user.totp_secret)) {
    return NextResponse.json(
      { error: 'Invalid TOTP token. Please check your authenticator app and try again.', code: 'INVALID_TOKEN' },
      { status: 400 }
    );
  }

  // Enable MFA
  await db.query(
    `UPDATE users
     SET totp_enabled = true,
         totp_verified_at = NOW()
     WHERE id = $1`,
    [auth.user.id]
  );

  // Log successful MFA enablement
  await logSimpleAdminAction(request, auth.user, 'admin.mfa_enabled', {
    targetId: auth.user.id,
    targetType: 'user',
  });

  return NextResponse.json({
    data: {
      success: true,
      message: 'Two-factor authentication enabled successfully',
    },
  });
}

/**
 * DELETE /api/admin/mfa/setup
 * Cancel MFA setup (before verification) or disable MFA
 * Requires verification with current TOTP code if MFA is enabled
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token'); // Required if MFA is already enabled

  const db = getTenantDb(auth.user.tenant_id);

  // Get user's MFA status
  const user = await db.findOne<{
    id: string;
    totp_enabled: boolean;
    totp_secret: string | null;
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

  // If MFA is already enabled, require token to disable
  if (user.totp_enabled) {
    if (!token) {
      return NextResponse.json(
        { error: 'TOTP token required to disable MFA. Include ?token=XXXXXX in the URL.', code: 'TOKEN_REQUIRED' },
        { status: 400 }
      );
    }

    if (!user.totp_secret || !verifyTOTP(token, user.totp_secret)) {
      return NextResponse.json(
        { error: 'Invalid TOTP token', code: 'INVALID_TOKEN' },
        { status: 400 }
      );
    }

    // Log MFA disable
    await logSimpleAdminAction(request, auth.user, 'admin.mfa_disabled', {
      targetId: auth.user.id,
      targetType: 'user',
    });
  } else {
    // Log setup cancellation
    await logSimpleAdminAction(request, auth.user, 'admin.mfa_setup_cancelled', {
      targetId: auth.user.id,
      targetType: 'user',
    });
  }

  // Clear MFA data
  await db.query(
    `UPDATE users
     SET totp_secret = NULL,
         totp_enabled = false,
         totp_verified_at = NULL,
         recovery_codes = NULL
     WHERE id = $1`,
    [auth.user.id]
  );

  return NextResponse.json({
    data: {
      success: true,
      message: user.totp_enabled
        ? 'Two-factor authentication disabled'
        : 'MFA setup cancelled',
    },
  });
}
