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
import { resolveOrProvisionAppUser } from '@/lib/domain/auth/provision-app-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const createdUser = await resolveOrProvisionAppUser(signInData.user);
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
