import { NextResponse } from 'next/server';
import {
  getSupabaseServerAuthClient,
  isSupabaseAuthConfigured,
} from '@/lib/infrastructure/auth/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json(
      { success: false, error: 'AUTH_NOT_CONFIGURED', message: 'Authentication is not configured.' },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const supabase = getSupabaseServerAuthClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    console.error('[Google OAuth] Failed to initiate:', error);
    return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_init_failed`);
  }

  return NextResponse.redirect(data.url);
}
