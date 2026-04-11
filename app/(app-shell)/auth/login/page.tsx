// ============================================
// Galeria - Login Page
// ============================================
// User login page

'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center"
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="rounded-[28px] border border-[#e5d8ca]/80 bg-[#fcf8f2] p-8 shadow-xl shadow-[#d8cab8]/20 dark:border-gray-800 dark:bg-gray-800 dark:shadow-none"
        >
          <GoogleSignInButton label="Sign in with Google" />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#fcf8f2] px-2 text-stone-500 dark:bg-gray-800 dark:text-gray-500">
                or continue with email
              </span>
            </div>
          </div>
          <LoginForm />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center text-sm text-stone-600 dark:text-gray-400"
        >
          <p>
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
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
