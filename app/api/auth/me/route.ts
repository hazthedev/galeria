// ============================================
// Galeria - Current User API Endpoint
// ============================================
// GET /api/auth/me
// Returns the current authenticated user's information

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, extractSessionId } from '@/lib/domain/auth/session';
import type { IMeResponse } from '../../../../lib/types';
import type { IUser } from '../../../../lib/types';

// Configure route to use Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET /api/auth/me
 * Get current authenticated user information
 */
export async function GET(request: NextRequest) {
  const noStoreHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
    Vary: 'Cookie',
  } as const;

  try {
    // Extract session ID from cookie or header
    const cookieHeader = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');

    const { sessionId } = extractSessionId(cookieHeader, authHeader);

    if (!sessionId) {
      return NextResponse.json(
        {
          user: null,
          message: 'No session provided',
        },
        { status: 200, headers: noStoreHeaders }
      );
    }

    // Validate session. Retry briefly to handle edge propagation timing
    // right after login on distributed/serverless infrastructure.
    let result = await validateSession(sessionId);
    if (!result.valid && result.error === 'Session not found or expired') {
      await delay(120);
      result = await validateSession(sessionId);
    }
    if (!result.valid || !result.user) {
      return NextResponse.json(
        {
          user: null,
          message: result.error || 'Invalid session',
        },
        { status: 200, headers: noStoreHeaders }
      );
    }

    const user = result.user;

    // Return user and tenant info
    return NextResponse.json<IMeResponse>(
      {
        user: {
          ...user,
          password_hash: undefined, // Never send password hash
        } as IUser,
        session: result.session,
      },
      { status: 200, headers: noStoreHeaders }
    );

  } catch (error) {
    console.error('[ME] Error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An error occurred fetching user information',
      },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
