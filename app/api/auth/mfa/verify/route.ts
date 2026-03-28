// ============================================
// Galeria - MFA Verification API
// ============================================
// Endpoint to complete login when MFA is required

import { NextRequest, NextResponse } from 'next/server';
import { createSession, deleteSession, extractSessionId } from '@/lib/domain/auth/session';
import { getRequestIp, getRequestUserAgent } from '@/middleware/auth';
import { DEFAULT_TENANT_ID, SYSTEM_TENANT_ID } from '@/lib/constants/tenants';
import type { IAuthResponseSession, IUser } from '@/lib/types';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { verifyTOTP } from '@/lib/mfa/totp';
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/infrastructure/auth/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MFAVerifyRequest {
  mfaUserId: string;
  token: string;
  email: string;
  rememberMe?: boolean;
}

type MFAUserRecord = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenant_id: string;
  totp_secret: string | null;
  totp_enabled: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  password_hash?: string | null;
};

async function findMfaUser(mfaUserId: string, email: string): Promise<MFAUserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, tenant_id, totp_secret, totp_enabled, email_verified, created_at, updated_at, password_hash')
      .eq('id', mfaUserId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load MFA user: ${error.message}`);
    }

    if (data) {
      return {
        ...(data as MFAUserRecord),
        created_at: new Date(String(data.created_at)),
        updated_at: new Date(String(data.updated_at)),
      };
    }
  }

  const fallbackTenantIds = Array.from(new Set([DEFAULT_TENANT_ID, SYSTEM_TENANT_ID]));
  for (const tenantId of fallbackTenantIds) {
    const db = getTenantDb(tenantId);
    const user = await db.findOne<MFAUserRecord>('users', {
      id: mfaUserId,
      email: normalizedEmail,
    });

    if (user) {
      return user;
    }
  }

  return null;
}

/**
 * POST /api/auth/mfa/verify
 * Verify TOTP token and complete login after successful password auth
 *
 * This endpoint is called after successful password authentication when MFA is enabled.
 * It verifies the TOTP token and creates a session if valid.
 */
export async function POST(request: NextRequest) {
  try {
    const body: MFAVerifyRequest = await request.json();

    const { mfaUserId, token, email, rememberMe = false } = body;

    // Validate input
    if (!mfaUserId || !token || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_INPUT',
          message: 'mfaUserId, token, and email are required',
        },
        { status: 400 }
      );
    }

    // Validate token format
    const cleanToken = token.trim().replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanToken)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_TOKEN_FORMAT',
          message: 'Token must be 6 digits',
        },
        { status: 400 }
      );
    }

    // Get user and verify MFA
    const user = await findMfaUser(mfaUserId, email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    if (!user.totp_enabled || !user.totp_secret) {
      return NextResponse.json(
        {
          success: false,
          error: 'MFA_NOT_ENABLED',
          message: 'MFA is not enabled for this account',
        },
        { status: 400 }
      );
    }

    // Verify TOTP token
    if (!verifyTOTP(cleanToken, user.totp_secret)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_MFA_TOKEN',
          message: 'Invalid authentication code',
        },
        { status: 401 }
      );
    }

    // Token is valid - create session
    const ipAddress = getRequestIp(request);
    const userAgent = getRequestUserAgent(request);

    const cookieHeader = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');
    const { sessionId: existingSessionId } = extractSessionId(cookieHeader, authHeader);

    if (existingSessionId) {
      await deleteSession(existingSessionId);
    }

    const sessionId = await createSession(user as IUser, {
      ipAddress,
      userAgent,
      rememberMe,
    });

    const response = NextResponse.json<IAuthResponseSession>(
      {
        success: true,
        user: {
          ...user,
          password_hash: undefined,
          totp_secret: undefined,
        } as unknown as IUser,
        sessionId,
        message: 'Login successful',
      },
      { status: 200 }
    );

    const cookieOptions = getCookieOptions(rememberMe);
    response.cookies.set('session', sessionId, cookieOptions);

    return response;
  } catch (error) {
    console.error('[MFA_VERIFY] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An error occurred during MFA verification'
          : `MFA verify error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

function getCookieOptions(rememberMe: boolean) {
  const isSecure = process.env.NODE_ENV === 'production';
  const maxAge = rememberMe ? 2592000 : 604800;

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
