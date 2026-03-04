// ============================================
// Galeria - Current User API Endpoint
// ============================================
// GET /api/auth/me
// Returns the current authenticated user's information

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, extractSessionId } from '@/lib/domain/auth/session';
import { getTenantDb } from '@/lib/db';
import type { IMeResponse } from '../../../../lib/types';
import type { IUser, ITenant } from '../../../../lib/types';

// Configure route to use Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Get current authenticated user information
 */
export async function GET(request: NextRequest) {
  try {
    // Extract session ID from cookie or header
    const cookieHeader = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');

    console.log('[ME] Cookie header:', cookieHeader ? cookieHeader.substring(0, 50) + '...' : 'none');
    console.log('[ME] Auth header:', authHeader ? 'present' : 'none');

    const { sessionId } = extractSessionId(cookieHeader, authHeader);

    console.log('[ME] Extracted sessionId:', sessionId ? sessionId.substring(0, 10) + '...' : 'none');

    if (!sessionId) {
      return NextResponse.json(
        {
          user: null,
          message: 'No session provided',
        },
        { status: 200 }
      );
    }

    // Validate session
    const result = await validateSession(sessionId);
    console.log('[ME] Session valid:', result.valid, 'Error:', result.error);

    if (!result.valid || !result.user) {
      return NextResponse.json(
        {
          user: null,
          message: result.error || 'Invalid session',
        },
        { status: 200 }
      );
    }

    const user = result.user;

    // Fetch tenant information
    let tenant: ITenant | null = null;
    try {
      const db = getTenantDb(user.tenant_id);
      tenant = await db.findOne<ITenant>('tenants', { id: user.tenant_id });
    } catch (error) {
      console.error('[ME] Error fetching tenant:', error);
    }

    // Return user and tenant info
    return NextResponse.json<IMeResponse>(
      {
        user: {
          ...user,
          password_hash: undefined, // Never send password hash
        } as IUser,
        tenant: tenant || undefined,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[ME] Error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An error occurred fetching user information',
      },
      { status: 500 }
    );
  }
}