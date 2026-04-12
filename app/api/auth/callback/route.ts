import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/domain/auth/session';
import { resolveOrProvisionAppUser } from '@/lib/domain/auth/provision-app-user';
import { createTenant } from '@/lib/domain/tenant/tenant';
import {
  getSupabaseServerAuthClient,
  isSupabaseAuthConfigured,
} from '@/lib/infrastructure/auth/supabase-server';
import { getRequestIp, getRequestUserAgent } from '@/middleware/auth';
import { sendWelcomeEmail } from '@/lib/infrastructure/email/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Finalize an OAuth sign-in: provision tenant if needed, create app session.
 */
async function finalizeOAuthSession(
  request: NextRequest,
  supabase: ReturnType<typeof getSupabaseServerAuthClient>,
  appUrl: string
) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    console.error('[OAuth Callback] Failed to get user:', userError);
    return NextResponse.json({ error: 'auth_failed', redirectTo: null }, { status: 401 });
  }

  const authUser = userData.user;
  const metadata = authUser.user_metadata || {};

  // First-time OAuth user: create a tenant and update metadata
  if (!metadata.tenant_id) {
    const displayName =
      typeof metadata.full_name === 'string' && metadata.full_name.trim()
        ? metadata.full_name.trim()
        : typeof metadata.name === 'string' && metadata.name.trim()
          ? metadata.name.trim()
          : 'User';

    const tenant = await createTenant({
      tenant_type: 'white_label',
      brand_name: displayName,
      company_name: displayName,
      contact_email: authUser.email!,
      subscription_tier: 'free',
    });

    await supabase.auth.updateUser({
      data: {
        tenant_id: tenant.id,
        tenant_name: displayName,
        role: 'organizer',
        subscription_tier: 'free',
        name: displayName,
      },
    });

    authUser.user_metadata = {
      ...metadata,
      tenant_id: tenant.id,
      tenant_name: displayName,
      role: 'organizer',
      subscription_tier: 'free',
      name: displayName,
    };

    // Fire-and-forget welcome email for first-time OAuth sign-ups
    sendWelcomeEmail({ to: authUser.email!, name: displayName }).catch(() => { });
  }

  const user = await resolveOrProvisionAppUser(authUser);

  const sessionId = await createSession(user, {
    ipAddress: getRequestIp(request),
    userAgent: getRequestUserAgent(request),
    rememberMe: true,
  });

  const redirectTo = `${appUrl}/organizer`;
  const response = NextResponse.json({ redirectTo });
  response.cookies.set('session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2592000,
  });

  return response;
}

/**
 * GET /api/auth/callback?code=...
 * PKCE flow: Supabase redirects here with a code query param.
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const code = request.nextUrl.searchParams.get('code');

  if (!code || !isSupabaseAuthConfigured()) {
    // No code — Supabase may be using implicit flow.
    // Redirect to the client-side callback page which handles fragments.
    return NextResponse.redirect(`${appUrl}/auth/callback${request.nextUrl.hash}`);
  }

  try {
    const supabase = getSupabaseServerAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[OAuth Callback GET] Code exchange failed:', error);
      return NextResponse.redirect(`${appUrl}/auth/login?error=auth_failed`);
    }

    const result = await finalizeOAuthSession(request, supabase, appUrl);

    // For GET requests, redirect instead of returning JSON
    const body = await result.json();
    if (body.redirectTo) {
      const redirect = NextResponse.redirect(body.redirectTo);
      // Copy the session cookie from the JSON response
      const sessionCookie = result.cookies.get('session');
      if (sessionCookie) {
        redirect.cookies.set('session', sessionCookie.value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 2592000,
        });
      }
      return redirect;
    }

    return NextResponse.redirect(`${appUrl}/auth/login?error=auth_failed`);
  } catch (err) {
    console.error('[OAuth Callback GET] Error:', err);
    return NextResponse.redirect(`${appUrl}/auth/login?error=server_error`);
  }
}

/**
 * POST /api/auth/callback { access_token, refresh_token }
 * Implicit flow: client-side page sends tokens from the URL fragment.
 */
export async function POST(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({ error: 'auth_not_configured', redirectTo: null }, { status: 503 });
  }

  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token) {
      return NextResponse.json({ error: 'missing_token', redirectTo: null }, { status: 400 });
    }

    const supabase = getSupabaseServerAuthClient();
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || '',
    });

    if (error) {
      console.error('[OAuth Callback POST] setSession failed:', error);
      return NextResponse.json({ error: 'auth_failed', redirectTo: null }, { status: 401 });
    }

    return finalizeOAuthSession(request, supabase, appUrl);
  } catch (err) {
    console.error('[OAuth Callback POST] Error:', err);
    return NextResponse.json({ error: 'server_error', redirectTo: null }, { status: 500 });
  }
}
