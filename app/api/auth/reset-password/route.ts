// ============================================
// Galeria - Password Reset API
// ============================================
// Sends password reset emails and completes password resets

import { NextRequest, NextResponse } from 'next/server';
import {
  getSupabaseServerAuthClient,
  isSupabaseAuthConfigured,
} from '@/lib/infrastructure/auth/supabase-server';

interface ResetPasswordRequestBody {
  email?: string;
  password?: string;
  code?: string;
  accessToken?: string;
  refreshToken?: string;
}

const GENERIC_RESET_MESSAGE = 'If an account exists for that email, a reset link has been sent.';

function getResetRedirectUrl(request: NextRequest): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, '');
  return `${baseUrl}/auth/reset-password`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResetPasswordRequestBody;
    const email = body.email?.trim().toLowerCase() || '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    if (!isSupabaseAuthConfigured()) {
      console.error('[RESET_PASSWORD] Supabase auth is not configured.');
      return NextResponse.json({ success: true, message: GENERIC_RESET_MESSAGE });
    }

    const supabase = getSupabaseServerAuthClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getResetRedirectUrl(request),
    });

    if (error) {
      console.warn('[RESET_PASSWORD] Failed to send reset email:', error.message);
    }

    return NextResponse.json({ success: true, message: GENERIC_RESET_MESSAGE });
  } catch (error) {
    console.error('[RESET_PASSWORD] Request failed:', error);
    return NextResponse.json({ success: true, message: GENERIC_RESET_MESSAGE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as ResetPasswordRequestBody;
    const password = body.password || '';
    const code = body.code?.trim();
    const accessToken = body.accessToken?.trim();
    const refreshToken = body.refreshToken?.trim();

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.', code: 'INVALID_PASSWORD' },
        { status: 400 }
      );
    }

    if (!code && !(accessToken && refreshToken)) {
      return NextResponse.json(
        { error: 'Reset link is invalid or has expired.', code: 'INVALID_RESET_TOKEN' },
        { status: 400 }
      );
    }

    if (!isSupabaseAuthConfigured()) {
      return NextResponse.json(
        { error: 'Password reset is not configured on the server.', code: 'AUTH_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    const supabase = getSupabaseServerAuthClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.json(
          { error: 'Reset link is invalid or has expired.', code: 'INVALID_RESET_TOKEN' },
          { status: 400 }
        );
      }
    } else if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        return NextResponse.json(
          { error: 'Reset link is invalid or has expired.', code: 'INVALID_RESET_TOKEN' },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return NextResponse.json(
        { error: 'Unable to reset password. Please request a new link.', code: 'RESET_FAILED' },
        { status: 400 }
      );
    }

    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. Please sign in again.',
    });
  } catch (error) {
    console.error('[RESET_PASSWORD_PATCH] Request failed:', error);
    return NextResponse.json(
      { error: 'Unable to reset password. Please request a new link.', code: 'RESET_FAILED' },
      { status: 500 }
    );
  }
}
