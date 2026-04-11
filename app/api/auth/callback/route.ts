import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/domain/auth/session';
import { resolveOrProvisionAppUser } from '@/lib/domain/auth/provision-app-user';
import { createTenant } from '@/lib/domain/tenant/tenant';
import {
  getSupabaseServerAuthClient,
  isSupabaseAuthConfigured,
} from '@/lib/infrastructure/auth/supabase-server';
import { getRequestIp, getRequestUserAgent } from '@/middleware/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const code = request.nextUrl.searchParams.get('code');

  if (!code || !isSupabaseAuthConfigured()) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=missing_code`);
  }

  try {
    const supabase = getSupabaseServerAuthClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error('[OAuth Callback] Code exchange failed:', error);
      return NextResponse.redirect(`${appUrl}/auth/login?error=auth_failed`);
    }

    const authUser = data.user;
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

      // Persist tenant assignment in Supabase user metadata
      await supabase.auth.updateUser({
        data: {
          tenant_id: tenant.id,
          tenant_name: displayName,
          role: 'organizer',
          subscription_tier: 'free',
          name: displayName,
        },
      });

      // Patch the in-memory object so provision sees the updated metadata
      authUser.user_metadata = {
        ...metadata,
        tenant_id: tenant.id,
        tenant_name: displayName,
        role: 'organizer',
        subscription_tier: 'free',
        name: displayName,
      };
    }

    const user = await resolveOrProvisionAppUser(authUser);

    const sessionId = await createSession(user, {
      ipAddress: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
      rememberMe: true,
    });

    const response = NextResponse.redirect(`${appUrl}/organizer/events`);
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 2592000, // 30 days
    });

    return response;
  } catch (err) {
    console.error('[OAuth Callback] Error:', err);
    return NextResponse.redirect(`${appUrl}/auth/login?error=server_error`);
  }
}
