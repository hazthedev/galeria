'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Client-side OAuth callback page.
 *
 * Supabase implicit flow redirects here with tokens in the URL fragment
 * (#access_token=...). Fragments are never sent to the server, so this
 * page extracts them client-side and POSTs to the server callback endpoint.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken) {
      router.replace('/auth/login?error=missing_token');
      return;
    }

    fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.redirectTo) {
          router.replace(data.redirectTo);
        } else {
          router.replace(`/auth/login?error=${data.error || 'auth_failed'}`);
        }
      })
      .catch(() => {
        router.replace('/auth/login?error=server_error');
      });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-gray-600 dark:text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
