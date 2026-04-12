import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/domain/auth/session';
import { checkRegistrationRateLimit, createRateLimitErrorResponse } from '@/lib/api/middleware/rate-limit';
import { validatePassword, DEFAULT_PASSWORD_REQUIREMENTS } from '@/lib/auth';
import { getRequestIp, getRequestUserAgent } from '../../../../middleware/auth';
import type { IAuthResponseSession, IUser } from '../../../../lib/types';
import { registerSchema } from '../../../../lib/validation/auth';
import {
  getSupabaseAdminClient,
  getSupabaseServerAuthClient,
  isSupabaseAdminConfigured,
  isSupabaseAuthConfigured,
} from '@/lib/infrastructure/auth/supabase-server';
import { resolveOrProvisionAppUser } from '@/lib/domain/auth/provision-app-user';
import { createTenant, deleteTenantById } from '@/lib/domain/tenant/tenant';
import type { ITenant } from '@/types';
import { sendWelcomeEmail } from '@/lib/infrastructure/email/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function cleanupRegistrationArtifacts(options: {
  tenantId?: string | null;
  authUserId?: string | null;
}) {
  if (options.authUserId) {
    try {
      const adminClient = getSupabaseAdminClient();
      await adminClient.auth.admin.deleteUser(options.authUserId);
    } catch (cleanupError) {
      console.error('[REGISTER] Failed to clean up auth user:', cleanupError);
    }
  }

  if (options.tenantId) {
    try {
      await deleteTenantById(options.tenantId);
    } catch (cleanupError) {
      console.error('[REGISTER] Failed to clean up tenant:', cleanupError);
    }
  }
}

export async function POST(request: NextRequest) {
  let createdTenant: ITenant | null = null;
  let createdAuthUserId: string | null = null;

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

    const { email, password, name, tenantName } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();
    // If the user left the workspace name blank, generate a friendly default.
    const trimmedTenantName = tenantName?.trim() || `${trimmedName}'s Workspace`;

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

    createdTenant = await createTenant({
      tenant_type: 'white_label',
      brand_name: trimmedTenantName,
      company_name: trimmedTenantName,
      contact_email: normalizedEmail,
      subscription_tier: 'free',
    });

    const adminClient = getSupabaseAdminClient();
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: trimmedName,
        tenant_id: createdTenant.id,
        tenant_name: trimmedTenantName,
        role: 'organizer',
        subscription_tier: 'free',
      },
    });

    if (createError) {
      const duplicate = /already|exists|registered/i.test(createError.message || '');
      if (duplicate) {
        await cleanupRegistrationArtifacts({ tenantId: createdTenant.id });
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

    createdAuthUserId = createData.user.id;

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

    // Fire-and-forget — never block the registration response
    sendWelcomeEmail({ to: normalizedEmail, name: trimmedName }).catch(() => { });

    return response;
  } catch (error) {
    await cleanupRegistrationArtifacts({
      authUserId: createdAuthUserId,
      tenantId: createdTenant?.id,
    });

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
