// ============================================
// Galeria - Login Page
// ============================================
// User login page

'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LoginForm } from '@/components/auth/login-form';

function LoginPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-gray-800">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600 dark:text-violet-400" />
      </div>
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired');
  const hasShownExpiredToast = useRef(false);

  useEffect(() => {
    if (expired !== 'true' || hasShownExpiredToast.current) {
      return;
    }

    hasShownExpiredToast.current = true;
    toast.error('Your session expired. Please log in again.');
    router.replace('/auth/login');
  }, [expired, router]);

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
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
          <LoginForm />
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
