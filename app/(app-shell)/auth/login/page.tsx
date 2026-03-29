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
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { LoginForm } from '@/components/auth/login-form';
import { BrandMark } from '@/components/landing/BrandMark';

function LoginPageFallback() {
  return (
    <AuthPageShell>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e5d8ca]/80 bg-[#fcf8f2] shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600 dark:text-violet-400" />
      </div>
    </AuthPageShell>
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
    <AuthPageShell>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <BrandMark size={40} gradientId="gm-auth-login" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Galeria</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        <div className="rounded-[28px] border border-[#e5d8ca]/80 bg-[#fcf8f2] p-8 shadow-xl shadow-[#d8cab8]/20 dark:border-gray-800 dark:bg-gray-800 dark:shadow-none">
          <LoginForm />
        </div>

        <div className="text-center text-sm text-stone-600 dark:text-gray-400">
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
    </AuthPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
