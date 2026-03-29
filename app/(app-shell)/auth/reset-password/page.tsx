// ============================================
// Galeria - Reset Password Page
// ============================================

'use client';

import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ResetTokenState {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
}

function ResetPasswordPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-gray-800">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600 dark:text-violet-400" />
      </div>
    </div>
  );
}

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenState, setTokenState] = useState<ResetTokenState>({});
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code') || undefined;
    if (code) {
      setTokenState({ code });
      setTokenReady(true);
      return;
    }

    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token') || undefined;
      const refreshToken = hashParams.get('refresh_token') || undefined;

      if (accessToken && refreshToken) {
        setTokenState({ accessToken, refreshToken });
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      } else {
        setTokenState({});
      }
    }

    setTokenReady(true);
  }, [searchParams]);

  const hasValidToken = useMemo(
    () => Boolean(tokenState.code || (tokenState.accessToken && tokenState.refreshToken)),
    [tokenState]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasValidToken) {
      toast.error('Reset link is invalid or has expired.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tokenState,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Unable to reset password.');
      }

      toast.success('Password updated successfully. Please sign in again.');
      router.replace('/auth/login');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-violet-600 dark:text-violet-400">
              Galeria
            </h1>
          </Link>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Choose a new password for your account.
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
          {!tokenReady ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600 dark:text-violet-400" />
            </div>
          ) : hasValidToken ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  New password
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={isSubmitting}
                    className="min-h-11 w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 transition-colors duration-200 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    disabled={isSubmitting}
                    className="min-h-11 w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 transition-colors duration-200 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-11 w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                Reset link is invalid or has expired. Please request a new one.
              </div>
              <Link
                href="/auth/forgot-password"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
              >
                Request New Link
              </Link>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
