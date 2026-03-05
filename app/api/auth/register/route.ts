import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/domain/auth/session';
import { checkRegistrationRateLimit, createRateLimitErrorResponse } from '@/lib/api/middleware/rate-limit';
import { validatePassword, DEFAULT_PASSWORD_REQUIREMENTS } from '@/lib/auth';
import { getRequestIp, getRequestUserAgent } from '../../../../middleware/auth';
import type { IAuthResponseSession, IUser } from '../../../../lib/types';
import { registerSchema } from '../../../../lib/validation/auth';
import { DEFAULT_TENANT_ID } from '@/lib/constants/tenants';
import {
  getSupabaseAdminClient,
  getSupabaseServerAuthClient,
  isSupabaseAdminConfigured,
  isSupabaseAuthConfigured,
} from '@/lib/infrastructure/auth/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SupabaseUserLike = {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

function mapSupabaseUserToAppUser(rawUser: SupabaseUserLike): IUser {
  const metadata = rawUser.user_metadata || {};
  const now = new Date();

  return {
    id: rawUser.id,
    tenant_id: typeof metadata.tenant_id === 'string' ? metadata.tenant_id : DEFAULT_TENANT_ID,
    email: rawUser.email || '',
    name: typeof metadata.name === 'string' && metadata.name.trim() ? metadata.name : 'User',
    role: 'organizer',
    email_verified: Boolean(rawUser.email_confirmed_at),
    created_at: rawUser.created_at ? new Date(rawUser.created_at) : now,
    updated_at: rawUser.updated_at ? new Date(rawUser.updated_at) : now,
    subscription_tier: 'free',
  };
}

export async function POST(request: NextRequest) {
  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_INPUT',
          message: 'Invalid registration request',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (!isSupabaseAuthConfigured() || !isSupabaseAdminConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTH_NOT_CONFIGURED',
          message: 'Authentication is not configured on the server.',
        },
        { status: 503 }
      );
    }

    const { email, password, name } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_INPUT',
          message: 'Name must be at least 2 characters long',
        },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password, DEFAULT_PASSWORD_REQUIREMENTS);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'WEAK_PASSWORD',
          message: passwordValidation.errors.join(', '),
        },
        { status: 400 }
      );
    }

    const ipAddress = getRequestIp(request);
    const userAgent = getRequestUserAgent(request);

    const rateLimitResult = await checkRegistrationRateLimit(normalizedEmail, ipAddress);
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

    const adminClient = getSupabaseAdminClient();
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: trimmedName,
        tenant_id: DEFAULT_TENANT_ID,
        role: 'organizer',
        subscription_tier: 'free',
      },
    });

    if (createError) {
      const duplicate = /already|exists|registered/i.test(createError.message || '');
      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: 'USER_ALREADY_EXISTS',
            message: 'An account with this email already exists',
          },
          { status: 409 }
        );
      }

      throw createError;
    }

    if (!createData.user) {
      throw new Error('Failed to create user in Supabase');
    }

    // Verify credentials once and align with login path behavior.
    const supabase = getSupabaseServerAuthClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError || !signInData.user) {
      throw signInError || new Error('Failed to authenticate new user');
    }

    const createdUser = mapSupabaseUserToAppUser(signInData.user);
    const sessionId = await createSession(createdUser, {
      ipAddress,
      userAgent,
      rememberMe: false,
    });

    const response = NextResponse.json<IAuthResponseSession>(
      {
        success: true,
        user: {
          ...createdUser,
          password_hash: undefined,
        } as IUser,
        sessionId,
        message: 'Registration successful',
      },
      { status: 201 }
    );

    const cookieOptions = getCookieOptions(false);
    response.cookies.set('session', sessionId, cookieOptions);

    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt.getTime() / 1000).toString());

    return response;
  } catch (error) {
    console.error('[REGISTER] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred during registration',
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
