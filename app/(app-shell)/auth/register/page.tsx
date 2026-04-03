// ============================================
// Galeria - Register Page
// ============================================
// User registration page

'use client';

import { RegisterForm } from '@/components/auth/register-form';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { BrandMark } from '@/components/landing/BrandMark';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function RegisterPage() {
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
            <BrandMark size={40} gradientId="gm-auth-register" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Galeria</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-gray-400">
            Start capturing moments in seconds
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="rounded-[28px] border border-[#e5d8ca]/80 bg-[#fcf8f2] p-8 shadow-xl shadow-[#d8cab8]/20 dark:border-gray-800 dark:bg-gray-800 dark:shadow-none"
        >
          <RegisterForm />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-4 text-center"
        >
          <div className="text-sm text-stone-600 dark:text-gray-400">
            <p>
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-xs text-stone-500 dark:text-gray-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-stone-700 dark:hover:text-gray-400">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-stone-700 dark:hover:text-gray-400">
              Privacy Policy
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </AuthPageShell>
  );
}
