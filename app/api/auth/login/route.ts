import { NextRequest, NextResponse } from 'next/server';
import { createSession, deleteSession, extractSessionId } from '@/lib/domain/auth/session';
import { checkLoginRateLimit, createRateLimitErrorResponse } from '@/lib/api/middleware/rate-limit';
import { getRequestIp, getRequestUserAgent } from '../../../../middleware/auth';
import type { IAuthResponseSession, IUser, UserRole } from '../../../../lib/types';
import { loginSchema } from '../../../../lib/validation/auth';
import { DEFAULT_TENANT_ID } from '@/lib/constants/tenants';
import { getSupabaseServerAuthClient, isSupabaseAuthConfigured } from '@/lib/infrastructure/auth/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeRole(role: unknown): UserRole {
  if (role === 'guest' || role === 'organizer' || role === 'super_admin') {
    return role;
  }
  return 'organizer';
}

function mapSupabaseUserToAppUser(rawUser: {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
}): IUser {
  const metadata = rawUser.user_metadata || {};
  const now = new Date();

  return {
    id: rawUser.id,
    tenant_id: typeof metadata.tenant_id === 'string' ? metadata.tenant_id : DEFAULT_TENANT_ID,
    email: rawUser.email || '',
    name: typeof metadata.name === 'string' && metadata.name.trim() ? metadata.name : 'User',
    role: normalizeRole(metadata.role),
    email_verified: Boolean(rawUser.email_confirmed_at),
    created_at: rawUser.created_at ? new Date(rawUser.created_at) : now,
    updated_at: rawUser.updated_at ? new Date(rawUser.updated_at) : now,
    subscription_tier: typeof metadata.subscription_tier === 'string'
      ? metadata.subscription_tier as IUser['subscription_tier']
      : 'free',
  };
}

export async function POST(request: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_INPUT',
          message: 'Invalid login request',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (!isSupabaseAuthConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTH_NOT_CONFIGURED',
          message: 'Authentication is not configured on the server.',
        },
        { status: 503 }
      );
    }

    const { email, password, rememberMe = false } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const ipAddress = getRequestIp(request);
    const userAgent = getRequestUserAgent(request);

    const rateLimitResult = await checkLoginRateLimit(normalizedEmail, ipAddress);
    if (!rateLimitResult.allowed) {
      const errorResponse = createRateLimitErrorResponse(rateLimitResult);
      return NextResponse.json(errorResponse, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.floor(rateLimitResult.resetAt.getTime() / 1000).toString(),
          'Retry-After': errorResponse.retryAfter.toString(),
        },
      });
    }

    const supabase = getSupabaseServerAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    const user = mapSupabaseUserToAppUser(data.user);

    const cookieHeader = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');
    const { sessionId: existingSessionId } = extractSessionId(cookieHeader, authHeader);

    if (existingSessionId) {
      await deleteSession(existingSessionId);
    }

    const sessionId = await createSession(user, {
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
        } as IUser,
        sessionId,
        message: 'Login successful',
      },
      { status: 200 }
    );

    const cookieOptions = getCookieOptions(rememberMe);
    response.cookies.set('session', sessionId, cookieOptions);

    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt.getTime() / 1000).toString());

    return response;
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An error occurred during login'
          : `Login error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
